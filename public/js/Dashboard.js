queue()
    .defer(d3.json, "/api/data")
    .await(makeGraphs);

function makeGraphs(error, apiData) {
	
//Data Transformations
	var dataSet = apiData;
	var dateFormat = d3.time.format("%m/%d/%Y");
	dataSet.forEach(function(d) {
		d.date_posted = dateFormat.parse(d.date_posted);
				d.date_posted.setDate(1);
		d.total_spendings = +d.total_spendings;
	});

	//Crossfilter instance
	var cf = crossfilter(dataSet);

	//Define Dimensions
	var datePosted = cf.dimension(function(d) { return d.date_posted; });
	var ageGroup = cf.dimension(function(d) { return d.age_group; });
	var spendingType = cf.dimension(function(d) { return d.spending_type; });
	var incomeLevel = cf.dimension(function(d) { return d.income_level; });
	var state = cf.dimension(function(d) { return d.state; });


	//Calculate by group
	var transactionsByDate = datePosted.group(); 
	var transactionsByAge = ageGroup.group(); 
	var transactionsBySpendingType = spendingType.group();
	var transactionsByIncomeLevel = incomeLevel.group();
	var stateGroup = state.group();

	var all = cf.groupAll();

	// Total
	var totalSpendingsState = state.group().reduceSum(function(d) {
		return d.total_spendings;
	});


	var netTotalSpendings = cf.groupAll().reduceSum(function(d) {return d.total_spendings;});

	//Define range values for data
	var minDate = datePosted.bottom(1)[0].date_posted;
	var maxDate = datePosted.top(1)[0].date_posted;

//console.log(minDate);
//console.log(maxDate);

    //Charts
	var dateChart = dc.lineChart("#date-chart");
	var ageGroupChart = dc.rowChart("#ageGroup-chart");
	var spendingTypeChart = dc.rowChart("#spending-chart");
	var incomeLevelChart = dc.rowChart("#income-chart");
	var totalTransactions = dc.numberDisplay("#total-transactions");
	var netSpendings = dc.numberDisplay("#net-spendings");
	var stateSpendings = dc.barChart("#state-spendings");


  selectField = dc.selectMenu('#menuselect')
        .dimension(state)
        .group(stateGroup); 

       dc.dataCount("#row-selection")
        .dimension(cf)
        .group(all);


	totalTransactions
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	netSpendings
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(netTotalSpendings)
		.formatNumber(d3.format(".4s"));

	dateChart
		.height(220)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(datePosted)
		.group(transactionsByDate)
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.renderHorizontalGridLines(true)
    	.renderVerticalGridLines(true)
		.xAxisLabel("Year")
		.yAxis().ticks(6);

	spendingTypeChart
        .height(220)
        .dimension(spendingType)
        .group(transactionsBySpendingType)
        .elasticX(true)
        .xAxis().ticks(5);

	incomeLevelChart
		//.width(300)
		.height(220)
        .dimension(incomeLevel)
        .group(transactionsByIncomeLevel)
        .xAxis().ticks(4);

	ageGroupChart
		.height(220)
        .dimension(ageGroup)
        .group(transactionsByAge)
        .xAxis().ticks(4);


    stateSpendings
        .height(220)
        .transitionDuration(1000)
        .dimension(state)
        .group(totalSpendingsState)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .centerBar(false)
        .gap(5)
        .elasticY(true)
        .x(d3.scale.ordinal().domain(state))
        .xUnits(dc.units.ordinal)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .ordering(function(d){return d.value;})
        .yAxis().tickFormat(d3.format("s"));



    dc.renderAll();

};