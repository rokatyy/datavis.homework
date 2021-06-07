const width = 1000;
const barWidth = 600;
const height = 400;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
    .attr('width', barWidth)
    .attr('height', height);

const scatterPlot = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height);

const lineChart = d3.select('#line-chart')
    .attr('width', width)
    .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected = 'Russia';

const x = d3.scaleLinear().range([margin * 2, width - margin]);
const y = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin * 2, barWidth - margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height - margin, margin])

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d => d.region)).values());

    d3.select('#range').on('change', function () {
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function () {
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function () {
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#param').on('change', function () {
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#y').on('change', function () {
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLineChart();
    });

    function updateBar() {
        barChart.selectAll("g, rect").remove()

        let regions = d3.set(data.map(d => d.region)).values()
        let data_regions = []

        regions.forEach(reg => {
            data_regions.push({
                'region': reg,
                'mean': d3.mean(data, function (d) {
                    if (reg === d.region) return d[param][year]
                })
            });
        });

        let xRange = xBar
            .domain(data_regions.map(function (d) {
                return d.region;
            }));

        let yRange = yBar
            .domain([0, d3.max(data_regions, function (d) {
                return d.mean;
            })]);

        barChart.append('g')
            .attr('transform', `translate(0, ${height - margin})`)
            .call(d3.axisBottom(xRange))

        barChart.append('g')
            .attr('transform', `translate(${margin * 2}, 0)`)
            .call(d3.axisLeft(yRange))

        barChart.selectAll(".bar")
            .data(data_regions)
            .enter()
            .append("rect")
            .attr("id", function (d) {
                return 'bar_' + d.region;
            })
            .attr("x", function (d) {
                return xRange(d.region);
            })
            .attr("y", function (d) {
                return yRange(d.mean) - 30;
            })
            .style("fill", function (d) {
                return colorScale(d.region);
            })
            .attr("width", xRange.bandwidth())
            .attr("height", function (d) {
                return height - yRange(d.mean);
            })
            .style("opacity", "1")
            .on('click', function () {
                if (highlighted === "" || highlighted !== this.id) {
                    highlighted = this.id
                    d3.selectAll('rect').style("opacity", "0.3")
                    d3.selectAll('circle').style("opacity", "0")

                    data_regions.map(function (d) {
                        return 'bar_' + d.region;
                    }).forEach(id => {
                        if (id === this.id) {
                            d3.select('#' + id).style("opacity", "1")
                            d3.selectAll("circle[region='" + id.replace("bar_", "") + "']")
                                .style("opacity", "0.7")
                        }
                    })
                    return
                }
                if (highlighted === this.id) {
                    highlighted = ""
                    d3.selectAll('rect').style("opacity", "1")
                    d3.selectAll('circle').style("opacity", "0.7")
                }
            });

    }
    function updateLineChart(){
        if (selected !== '') {
            d3.select('.country-name').text(selected);

            chartData = Object.entries(
                data.filter(d => d.country === selected)[0][lineParam]
            ).slice(0, 221)
            dates = chartData.map(d => +d[0])
            charValues = chartData.map(d => +d[1])

            xLineAxis.call(d3.axisBottom(x.domain([d3.min(dates), d3.max(dates)])));

            yLineAxis.call(d3.axisLeft(y.domain([d3.min(charValues), d3.max(charValues)])));

            lineChart.selectAll('path').remove();

            lineChart.append("path")
                .datum(chartData)
                .attr("class", "lineData")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => {console.log(d); return x(+d[0])})
                    .y(d => y(+d[1]))
                )
        }
    }



    function updateScattePlot() {
        scatterPlot.selectAll("g").remove();

        let X = d3.scaleLinear()
            .range([margin * 2, width - margin])
            .domain([
                d3.min(data, function (d) {
                    return +d[xParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[xParam][year];
                })
            ]);

        let Y = d3.scaleLinear()
            .range([height - margin, margin])
            .domain([
                d3.min(data, function (d) {
                    return +d[yParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[yParam][year];
                })
            ]);

        scatterPlot.append('g')
            .attr('transform', `translate(0, ${height - margin})`)
            .call(d3.axisBottom(X));

        scatterPlot.append('g')
            .attr('transform', `translate(${margin * 2}, 0)`)
            .call(d3.axisLeft(Y))

        var radiusScale = d3.scaleSqrt()
            .range([10, 30])
            .domain([
                d3.min(data, function (d) {
                    return +d[rParam][year];
                }),
                d3.max(data, function (d) {
                    return +d[rParam][year];
                })
            ]);

        scatterPlot.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .on('click', ScatterClick)
            .attr("cx", function (d) {
                return X(d[xParam][year]);
            })
            .attr("cy", function (d) {
                return Y(d[yParam][year]);
            })
            .attr("r", function (d) {
                return radiusScale(d[rParam][year]);
            })
            .style("fill", function (d) {
                return colorScale(d.region);
            })
            .attr("region", function (d) {
                return d.region
            })
            .style("opacity", "0.6")
            .attr("stroke", "black")

        function ScatterClick(clicked, i) {
            selected = clicked.country
            scatterPlot.selectAll('circle')
                .attr('stroke-width', d => d.country === clicked.country ? 3 : 1);
            d3.select(this).raise();
            d3.event.stopPropagation();

            updateLineChart();
        }
    }

    updateBar();
    updateScattePlot();
    updateLineChart()
});

async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d => {
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}