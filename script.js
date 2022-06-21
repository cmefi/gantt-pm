//const today = moment.tz('US/Eastern').startOf('date');
const start_work_hour = 10;
const end_work_hour = 20;
//const day = 1000 * 60 * 60 * 24;


const get_colors = () => ["#7cb5ec", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"];


// Parse dates
const tasks_int = jsyaml.load(yaml).tasks.map(function(task) {

    const date_split =  task.r ? task.r.trim().split('-') : null;
    const start = date_split == null ? '1/1/23' : date_split.length === 2 ? date_split[0] : date_split[0];
    const end = date_split == null ? '1/1/23' : date_split.length === 2 ? date_split[1] : date_split[0];

    return {
        ...task,
        start: task.r ? moment(start, 'MM/DD/YY').format('YYYY-MM-DD') : '2022-01-01',
        end: task.r ? moment(end, 'MM/DD/YY').format('YYYY-MM-DD') : '2023-01-01'
    }
});

const tasks = tasks_int.reduce(function (accum, x) {

    const is_child = x.hasOwnProperty('r');
    const project_id = is_child === true ? accum.project_id : x.n;
    const project_index = is_child === true ? accum.project_index : accum.project_index + 1;
    const task_id = is_child ? x.n : x.n;

    const task = {
        name: x.n,
        id: task_id,
        parent: (is_child ? project_id : null),
        color: (is_child ? get_colors()[project_index]: 'transparent'),
        start: moment.tz(x.start, 'US/Eastern').set('hour', start_work_hour).utc().valueOf(),
        end: moment.tz(x.end, 'US/Eastern').set('hour', end_work_hour).utc().valueOf(),
        completed: x.c,
        collapsed: is_child ? null : false,
        dependency: x.dep ? x.dep === ':prev' ? accum.task_id : x.dep : null,
        custom: {
            is_child: is_child,
            project_id: project_id,
            project_index: project_index,
            description: x.d ? x.d : null,
            link: x.l ? x.l : null
        }
    };

    return {tasks: accum.tasks.concat([task]), project_id: project_id, project_index: project_index, task_id: task_id};

}, {tasks: [], project_id: '', project_index: -1}).tasks;


let date_range = [];
for (var m = moment.tz('US/Eastern').add(-365, 'days'); m.isBefore(moment.tz('US/Eastern').add(365, 'days')); m.add(1, 'days')) {
    date_range.push(m.format('YYYY-MM-DD'));
}

const breaks = date_range
    .map(d => ({
        str_date: d,
        date: moment.tz(d, 'US/Eastern'),
        is_weekend: moment.tz(d, 'US/Eastern').isoWeekday() === 6 || moment.tz(d, 'US/Eastern').isoWeekday() === 7
    }))
    .map(function(d) {
        const this_date = d.date;
        if (d.is_weekend === true) {
            return {
                ...d,
                color: '#CFD1D1',
                from: this_date.utc().valueOf(),
                to: this_date.add(1, 'day').utc().valueOf()
            }
        } else {
            return [{
                ...d,
                color: '#CFD1D1',
                from: this_date.clone().utc().valueOf(),
                to: this_date.clone().add(start_work_hour, 'hours').utc().valueOf()
            }, {
                ...d,
                color: '#CFD1D1',
                // Bug? this_date object keeps being modified! https://stackoverflow.com/questions/49482200/moment-add-changes-previously-set-variable
                from: this_date.clone().add(end_work_hour, 'hours').utc().valueOf(),
                to: this_date.clone().add(24, 'hours').utc().valueOf()
            }]
        }
    })
    .flat(1)
    .map(x => ({
        ...x,
         str_from: moment.utc(x.from).local('US/Eastern').format(),
         str_to: moment.utc(x.to).local('US/Eastern').format()
    }));

/*
Highcharts.setOptions({
    time: {
        timezone: 'US/Eastern'
    }
});
*/


Highcharts.setOptions({
    time: {
        /**
         * Use moment-timezone.js to return the timezone offset for individual
         * timestamps, used in the X axis labels and the tooltip header.
         */
        getTimezoneOffset: function (timestamp) {
            var zone = 'US/Eastern',
                timezoneOffset = -moment.tz(timestamp, zone).utcOffset();

            return timezoneOffset;
        }
    }
});


const date_ind =
    moment.max(
        moment.min(
            moment.tz('US/Eastern'),
            moment.tz('US/Eastern').set('hour', end_work_hour)
        ),
        moment.tz('US/Eastern').set('hour', start_work_hour)
    ).utc().valueOf();

// THE CHART
const o = {
    chart: {
        //height: 800, //Without first/default value function doesn't work
    },
    credits: {
        enabled: false
    },
    title: {
        text: 'Charles Projects'
    },
    yAxis: {
        staticScale: 20
    },
    xAxis: [{
        //plotBands: breaks,
        breaks: breaks,
        tickInterval: 24 * 3600 * 1000,
        plotLines: [{
            color: 'rgba(255, 100, 100, .5)', // Red
            width: 2,
            value:  date_ind,
            zIndex: 5

        }],
        min: moment.tz('US/Eastern').startOf('isoweek').utc().valueOf(),
        max: moment.tz('US/Eastern').add(4, 'weeks').endOf('isoweek').utc().valueOf(),
        /*dateTimeLabelFormats: {
            week: {
                list: ['W%W', 'W%W']
            },
            day: {
                list: ['%E']
            }
        },*/
        labels: {
            formatter: function() {

                if ([6, 7].includes(moment.utc(this.value).tz('US/Eastern').isoWeekday())) return

                // https://stackoverflow.com/questions/21737974/moment-js-how-to-get-week-of-month-google-calendar-style
                const this_date = moment.utc(this.value).tz('US/Eastern');
                moment.updateLocale('en', { weekdaysMin: 'U_M_T_W_R_F_S'.split('_') });

                return moment(this_date).format('dd');
            }
        }


    }, {
        // This axis is for the top bar only (week indicator)
        tickInterval: 24 * 3600 * 1000 * 7,
        labels: {
            formatter: function() {
                // https://stackoverflow.com/questions/21737974/moment-js-how-to-get-week-of-month-google-calendar-style
                const this_date = moment.utc(this.value).tz('US/Eastern');
                const week_of_month = Math.ceil(this_date.date() / 7); //1
                return moment(this_date).format('MMMM') + ' W' + week_of_month;
            }
        }
    }],
    /*
    plotOptions: {
        gantt: {
            dataLabels: {
                formatter: function() {
                var point = this.point,
                    amount = point.partialFill;
                if (Highcharts.isObject(amount)) {
                    amount = amount.amount;
                }
                if (Highcharts.isNumber(amount) && amount >= 0) {
                    return '';//return Highcharts.correctFloat(amount * 100) + '%';
                }
                }
            },
            // Set default connection options here
            connectors: {
                lineWidth: 1,
                marker: {
                    color: 'transparent'
                }
            }
        }
    },*/
    tooltip: {
        formatter: function() {
            console.log(this.point);
            const text =
                '<b>'+ this.point.name + '</b>' +
                (this.point.custom.description ? '<br/>' + this.point.custom.description + '<br>' : '') +
                (this.point.custom.link ? '<hr><a target="_blank" href="' + this.point.custom.link + '">Link</a>' : '')
            return text;
        },
        useHTML: true,
        hideDelay: 1500,
        style: {
            pointerEvents: 'auto'
        }

    },
    rangeSelector: {
        enabled: true,
        buttonTheme: { // styles for the buttons
            width: '6rem',
            padding: 5
        },
        buttons: [{
            text: '3W',
            events: {
                click: function(e) {
                    const state = $('#item').highcharts().rangeSelector.buttons[0].state;
                    chart.xAxis[0].setExtremes(
                        moment.tz('US/Eastern').startOf('isoweek').toDate().getTime(),
                        moment.tz('US/Eastern').add(4, 'weeks').endOf('isoweek').toDate().getTime()
                        );
                    $('#item').highcharts().rangeSelector.buttons[0].setState(state === 0 ? 2 : 0);
                    return false;
                }
            },
        }, {
            text: '6W',
            events: {
                click: function(e) {
                    const state = $('#item').highcharts().rangeSelector.buttons[1].state;
                    chart.xAxis[0].setExtremes(
                        moment.tz('US/Eastern').startOf('isoweek').toDate().getTime(),
                        moment.tz('US/Eastern').add(6, 'weeks').endOf('isoweek').toDate().getTime()
                        );
                    $('#item').highcharts().rangeSelector.buttons[1].setState(state === 0 ? 2 : 0);
                    return false;
                }
            }
        }, {
            text: 'Month',
            events: {
                click: function(e) {
                    const state = $('#item').highcharts().rangeSelector.buttons[2].state;
                    chart.xAxis[0].setExtremes(
                        moment.tz('US/Eastern').startOf('month').utc().valueOf(),
                        moment.tz('US/Eastern').endOf('month').utc().valueOf()
                        );
                    $('#item').highcharts().rangeSelector.buttons[2].setState(state === 0 ? 2 : 0);
                    return false;
                }
            }
        }],
        inputEnabled: true
    },
    navigator: {
        enabled: false,
        liveRedraw: false,
        series: {
            type: 'gantt',
            pointPlacement: 0.5,
            pointPadding: 0.25
        }
    },
    series: [{
        data: tasks,
        //colors: ['#7cb5ec']
    }]
};

const chart = Highcharts.ganttChart('item', o);
chart.rangeSelector.buttons[0].setState(2);
