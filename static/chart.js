function chartHandler() {
    chartHandler.addConfirmedTransactionToChart = function (trustScore, duration) {
        highcharts.series[0].addPoint([trustScore, duration]);
    }

    let highcharts = Highcharts.chart('chart', {
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        boost: {
            useGPUTranslations: true,
            usePreAllocated: true
        },
        title: {
            text: 'Tcc duration by trust score'
        },
        xAxis: {
            min: 0,
            max: 100,
            title: {
                enabled: true,
                text: 'Trust Score'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            min: 0,
            max: 400,
            title: {
                text: 'Duration by seconds'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 90,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x}, {point.y}'
                }
            }
        },
        series: [{
            name: 'Confirmed transactions',
            color: 'rgba(223, 83, 83, .05)',
            data: [
            ]

        }]
    });
}

chartHandler();