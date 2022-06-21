const yaml = `
---
# This is a JS file containing YAML
# Valid keys are: n (name), r (date range), c (completed), d (description), dep (dependency)
# For projects, assign no date range (r).
# For tasks, always assign a date range (r). Completed (c), description (d), and dependency (dep) are optional.
#   To make dependent on the previous row, use dep: :prev. Otherwise, use the name of the previous column.
tasks: [
    {n: Onboarding (ob)},
    {n: Create PM System, r: 6/20/22-6/21/22, c: 1, l: test.com},
    {n: H2 Month Plan, r: 6/21/22-6/23/22, c: .2},
    {n: Work on aTSR vs hTSR Project from John, r: 6/27/22-6/29/22, c: 0},
    {n: HR Compliance, r: 6/29/22-6/30/22, c: 0},

    {n: LEDO (ledo)},
    {n: Intro Meeting, r: 6/20/22, c: 1}
]
...
`
