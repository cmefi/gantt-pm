//const today = moment.tz('US/Eastern').startOf('date');
const start_work_hour = 10;
const end_work_hour = 20;
//const day = 1000 * 60 * 60 * 24;


const get_colors = () => ["#7cb5ec", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"];

const tasks = tasks_raw.reduce(function (accum, x) {

    const is_child = x.hasOwnProperty('id') === false;
    const project_id = is_child === true ? accum.project_id : x.id;
    const project_index = is_child === true ? accum.project_index : accum.project_index + 1;

    const task = {
        name: x.n,
        id: (is_child ? null : x.id),
        parent: (is_child ? project_id : null),
        color: (is_child ? get_colors()[project_index]: 'transparent'),
        start: moment.tz(x.s, 'US/Eastern').set('hour', start_work_hour).utc().valueOf(),
        end: moment.tz(x.e, 'US/Eastern').set('hour', end_work_hour).utc().valueOf(),
        completed: x.c,
        collapsed: is_child ? null : false,
        custom: {
            is_child: is_child,
            project_id: project_id,
            project_index: project_index,
            description: x.d ? x.d : '',
        }
    };

    return {tasks: accum.tasks.concat([task]), project_id: project_id, project_index: project_index};

}, {tasks: [], project_id: '', project_index: -1}).tasks;

/*
const tasks = tasks_raw.map(x => ({
    name: x.n,
    id: x.id,
    color: (!x.p ? 'transparent' : null),
    ...(x.p && {parent: x.p}),
    start: moment.tz(x.s, 'US/Eastern').set('hour', start_work_hour).utc().valueOf(),
    end: moment.tz(x.e, 'US/Eastern').set('hour', end_work_hour).utc().valueOf(),
    completed: x.c,
    ...(!x.p && {collapsed: false}),
    custom: {
       description: x.d ? x.d : ''
    }
}));
*/

let date_range = [];
for (var m = moment.tz('US/Eastern').add(-5, 'days'); m.isBefore(moment.tz('US/Eastern').add(100, 'days')); m.add(1, 'days')) {
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
            moment.tz('US/Eastern').set('hour', start_work_hour)
        ),
        moment.tz('US/Eastern').set('hour', end_work_hour)
    ).utc().valueOf();

// THE CHART
Highcharts.ganttChart('container', {
    chart: {
        height: 800, //Without first/default value function doesn't work
    },
    credits: {
        enabled: false
    },
    title: {
        text: 'Charles Projects - Meta'
    },
    xAxis: {
        //plotBands: breaks,
        breaks: breaks,
        /*
        currentDateIndicator: {
            width: 1,
            dashStyle: 'dot',
            color: 'red',
            label: {
                format: ''
            }
        },
        */
        plotLines: [{
            color: 'rgba(255, 100, 100, .5)', // Red
            width: 2,
            value:  date_ind,
            zIndex: 5
        }],
        min: moment.tz('US/Eastern').startOf('week').utc().valueOf(),
        max: moment.tz('US/Eastern').add(40, 'days').startOf('day').utc().valueOf(),
        dateTimeLabelFormats: {
            week: {
                list: ['W%W', 'W%W']
            },
            day: {
                list: ['%E']
            }
        }
    },
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
            }
        }
    },
    tooltip: {
        formatter: function() {
            console.log(this.point);
            return '<b>'+ this.point.name + '</b><br/>'+this.point.custom.description +'<br>'
        },
        useHTML: true,
        hideDelay: 1500,
        style: {
        pointerEvents: 'auto'
        }

    },
    series: [{
        data: tasks,
        //colors: ['#7cb5ec']
    }]
},  function(chart) {
  //40 is a pixel value for one cell
  let chartHeight = 30 * chart.series[0].data.length;
  chart.update({
    chart: {
      height: chartHeight
    }
  })
});
