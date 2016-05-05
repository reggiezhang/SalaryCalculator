// Author: Siting Ren
// Version: 2016-05-05

window.onload = init;
function init(){
    calc = new Calculator();
    calc.displayCalc();
}

function Calculator(){
    this.DATA_PATH = './data/';
    this.insuranceOrder = ['pension', 'medical', 'unemployment', 'maternity', 'injury'];
    this.tax_free = 3500.0;
    this.max_housing_rate = 0.08;
    this.load_ready = false;
    this.staff_info = {};
    this.five_insurances = {'org':{}, 'indv':{}};
    this.individual_income_tax = [];
    this.performance_income = {};
    this.insurances_base = {};   
}
Calculator.prototype.constructor = Calculator;

Calculator.getPayroll = function (cal, person){
    // Get the payroll of one person    
    var post_wage = two_digits(person.post_wage);
    var performance_pay = two_digits(cal.performance_income[person.performance]);
    var housing_rate = person.housing_rate;
    var insurances_base;
    if (post_wage < cal.insurances_base.minBase){
        insurances_base = cal.insurances_base.minBase;
    }
    else if(post_wage > cal.insurances_base.maxBase){
        insurances_base = cal.insurances_base.maxBase;
    }
    else{
        insurances_base = post_wage;
    }
    var insurance_org = {}, subtotal_org = 0.0;
    var insurance_indv = {}, subtotal_indv = 0.0;
    var ins_list = cal.insuranceOrder;
    for (var i = 0; i < ins_list.length; i++){
        insurance_indv[ins_list[i]] = two_digits(insurances_base * calc.five_insurances.indv[ins_list[i]]);
        insurance_org[ins_list[i]] = two_digits(insurances_base * calc.five_insurances.org[ins_list[i]]);
        subtotal_indv += insurance_indv[ins_list[i]];
        subtotal_org += insurance_org[ins_list[i]];
    }
    var house_pay = two_digits(insurances_base * housing_rate);
    insurance_indv['housing'] = house_pay;
    insurance_org['housing'] = house_pay;
    subtotal_indv += house_pay;
    subtotal_org += house_pay;
    insurance_indv['subtotal'] = two_digits(subtotal_indv);
    insurance_org['subtotal'] = two_digits(subtotal_org);
    
    var pretax_income = post_wage + performance_pay - insurance_indv['subtotal'];
    var tax_info = cal.individual_income_tax, tax_rate = 0, deduction = 0;
    var tax = 0.0;
    if (pretax_income > cal.tax_free){
        for (var i = tax_info.length - 1; i >= 0; i--){
            var limit = tax_info[i][0];
            if ((pretax_income - cal.tax_free) > limit){
                tax_rate = tax_info[i][1];
                deduction = tax_info[i][2];
                break;
            }            
        }
        tax = two_digits((pretax_income - cal.tax_free) * tax_rate - deduction);
    }
    var aftertax_income = two_digits(pretax_income - tax);
    var payr = new Payroll(insurance_org, insurance_indv, post_wage, performance_pay, pretax_income, tax, aftertax_income);
    person.payroll = payr;
}

Calculator.loadAllPayroll = function (cal){
    // Iterate through the staff list and calculate all payrolls.
    var list = cal.staff_info;
    for (var i in list){
        if (isEmptyObject(list[i].payroll)){
            // Calculate only if the payroll of this staff is empty.
            Calculator.getPayroll(cal, list[i]);
        }
    }
}

Calculator.serializeLoadTasks = function (arr, fn, done){
    var current = 0;
    fn(function iterate() {
        if (++current < arr.length) {
            fn(iterate, arr[current]);
        } else {
            done();
        }
    }, arr[current]);
}

Calculator.prototype.displayCalc = function (){    
    loopFn = function (nextTask, value) {
        Calculator.loadCSV(value[0], value[1], value[2], value[3], value[4], nextTask);
    }
    Calculator.serializeLoadTasks([
        [this, this.performance_income, '绩效工资标准.csv', '#table_performance', 0],
        [this, this.five_insurances, '五险费率.csv', '#table_fiveInsurances', 1],
        [this, this.individual_income_tax, '个税税率.csv', '#table_tax', 0],
        [this, this.insurances_base, '本市职工月平均工资.csv', '#table_avgIncome', 1],
        [this, this.staff_info, '员工名单.csv', '#table_staff', 1]
    ], loopFn, function() {}
    );
      
    // Wait until load finish.
    var LOCKTIME = 400, timer;
    loadtime = function(){
        if(calc.load_ready){
            clearInterval(timer);
            Calculator.loadAllPayroll(calc);
        }
    }
    timer = setInterval("loadtime()", LOCKTIME);
}
Calculator.loadCSV = function (calc, des, filename, tableID, rowFrom, callback){
    // From filename load CSV file
    var insuranceOrder = calc.insuranceOrder;
    var tax_free = calc.tax_free;
    var performance_income = calc.performance_income;
   
    function callBack(data){
        // Store data and display them at Html
        if (tableID == '#table_avgIncome'){
            var item = data[rowFrom];
            avgIncome = parseFloat(item[0]);
            if (item === undefined || !avgIncome || avgIncome <= 0){
                alert(filename + "：数据格式不符，请重新上传。");
                return;
            }
            des.avgIncome = avgIncome;
            des.minBase = avgIncome * 0.6;
            des.maxBase = avgIncome * 3;
            
            // Create html for table
            tableHtml = '<tr><td>本市职工月均工资</td><td>' + des.avgIncome + '</td></tr>';
            tableHtml += '<tr><td>下限</td><td>' + des.minBase + '</td></tr>';
            tableHtml += '<tr><td>上限</td><td>' + des.maxBase + '</td></tr>';
            $(tableID + ' tbody').append(tableHtml);
            
        }
        else if (tableID == '#table_performance'){
            var head = data[rowFrom];
            var body = data[rowFrom + 1];
            
            if (head === undefined || body === undefined){
                alert(filename + "：数据格式不符，请重新上传。");
                return;
            }
            
            var headHtml = '<tr>';
            var bodyHtml = '<tr>';
            var options = '';
            for(var i = 0; i < head.length; i++){
                if (head[i].length == 0 || body[i].length == 0){
                    break;
                }
                headHtml += '<th>' + head[i] + '</th>';
                bodyHtml += '<td>' + body[i] + '</td>';
                options += '<option value="' + head[i] +'">' + head[i] + '</option>';
                
                des[head[i]] = parseFloat(body[i]);
                if ((des[head[i]]!= 0 && !des[head[i]]) || des[head[i]] < 0){
                    alert(filename + "：数据格式不符，请重新上传。");
                    return;
                }
            }
            headHtml += '</tr>';
            bodyHtml += '</tr>';
            
            $(tableID + ' thead').append(headHtml);
            $(tableID + ' tbody').append(bodyHtml);
            $('#performance').append(options);
        }
        else if (tableID == '#table_fiveInsurances'){
            var org = data[rowFrom];
            var indv = data[rowFrom + 1];
               
            if (org === undefined || indv === undefined){
                alert(filename + "：数据格式不符，请重新上传。");
                return;
            }
          
            var orgHtml = '<tr><td>公司</td>';
            var indvHtml = '<tr><td>个人</td>';
            for(var i = 1; i < 6; i++){
                if (org[i].length == 0 || indv[i].length == 0){
                    alert(filename + "：数据格式不符，请重新上传。");
                    return;
                }
                
                orgHtml += '<td>' + org[i] + '</td>';
                indvHtml += '<td>' + indv[i] + '</td>';
                
                des.org[insuranceOrder[i-1]] = parseFloat(org[i]);
                des.indv[insuranceOrder[i-1]] = parseFloat(indv[i]);
            }
            orgHtml += '</tr>';
            indvHtml += '</tr>';
            $(tableID + ' tbody').append(orgHtml);
            $(tableID + ' tbody').append(indvHtml);            
        }
        else if (tableID == '#table_tax'){            
            var interval = data[rowFrom];
            var rate = data[rowFrom + 1];
            
            if (interval === undefined || rate === undefined){
                alert(filename + "：数据格式不符，请重新上传。");
                return;
            }
            var tableHtml = '';
            var last_tax = parseFloat(rate[0]);
            if (!last_tax || last_tax < 0){
                alert(filename + "：数据格式不符，请重新上传。");
                return;
            }
            var last_deduction = 0.0;
            for(var i = 0; i < rate.length; i++){
                // valid check
                var intv = parseFloat(interval[i]);
                var tax = parseFloat(rate[i]);
                var deduction = two_digits(last_deduction + (tax - last_tax) * intv);
                               
                tableHtml += '<tr>';
                if (i == rate.length - 1){
                    tableHtml += '<td>&gt;' + intv + '</td>';
                }
                else{
                    upper_limit = parseFloat(interval[i+1]);
                    tableHtml += '<td>' + intv + '-' + upper_limit + '</td>';
                }
                tableHtml += '<td>' + tax*100 + '%</td><td>' + deduction + '</td>';
                tableHtml += '</tr>';
                
                des.push([intv, tax, deduction]);
                last_tax = tax;
                last_deduction = deduction;                
            } 
            tableHtml += '<tr><td colspan="3" ><i> 注: 税前扣除额'+ tax_free +'元</i></td></tr>';
            $(tableID + ' tbody').append(tableHtml);
        }
        else if (tableID == '#table_staff'){
            var tableHtml = '';
            for(var i = rowFrom; i < data.length; i++) {
                var item = data[i];
                // Validation Check
                if (item === undefined || item.length < 4){
                    alert(filename + "：数据格式不符，请重新上传。");
                    return;
                }
                var sname = item[0];
                var post_wage = parseFloat(item[1]);
                var performance = item[2];
                if (!(performance in performance_income)){
                    alert(filename + "：绩效评分[" + performance + "]无法识别，请重新上传。");
                    return;
                }
                var housing_rate = parseFloat(item[3]);
                if (calc.max_housing_rate < housing_rate){
                    alert(filename + "：该单位住房公积金缴纳比例为 0%～8%, 数据范围不符，请重新上传。");
                    return;
                }
                
                // Each row of the CSV file contains the info of one staff.
                var person = new Staff(sname, post_wage, performance, housing_rate);
                des[sname] = person;
            
                // Create html for table
                tableHtml += '<tr>';
                for(var j = 0; j < 4; j++){
                    tableHtml += '<td>' + item[j] + '</td>';
                }
                tableHtml += '<td><center><input type="button" name="button" value="查看"  onclick="javascript:showDiv(\''
                tableHtml += person.name+'\');"/></center></td>';
                tableHtml += '</tr>';
            }            
            $(tableID + ' tbody').append(tableHtml);
            calc.load_ready = true;
        }
        else{
            alert("导入数据时出现错误。");
        }
    }
    
    // Convert CSV to JSON and display
    Papa.parse(calc.DATA_PATH + filename, {
        download: true,
        complete: function(results) {
            callBack(results.data);
        }    
    });
    callback();
}


function saveSalaryBtnOnclick(){
    if (!calc.load_ready){
        alert("数据导入失败，无法下载文件。");
        return;
    }
    // Save payroll as a CSV file.
    var data_array = [];
    for (var p in calc.staff_info){
        var payr = calc.staff_info[p].payroll;
        data_array.push([p, payr.post_wage, payr.performance_pay, 
            payr.insurance_indv.subtotal, payr.insurance_org.subtotal, 
            payr.pretax_income, payr.tax, payr.aftertax_income]);
    }
    var csv = Papa.unparse({
    	fields: ["员工姓名", "岗位工资", "绩效工资", "五险一金(个人)", 
                 "五险一金(单位)", "税前收入", "扣税", "税后收入"],
    	data: data_array
    },{newline: "\n"});
    
    var BB = self.Blob;
    var contentStr = csv;
    var fileName= "收入详情.csv";
    saveAs(
        new BB(
            [contentStr] //防止utf8 bom防止中文乱码 此行可改为["\ufeff"+contentStr] 
            ,{ type: "text/plain;charset=utf8" }
        ) , fileName);
}


function two_digits(num) {
    return Math.round(num * 100) / 100.0;
}


function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}


function showDiv(person){
    // For personal payroll display
    $("#BgDiv").css({ display:"block",height:$(document).height()});
    payrollHtml = '<div style="margin: 7% 7% 7% 7%">';
    payrollHtml += '<h2>'+person+'的工资单</h2>';
    payrollHtml += '<h3>五险一金详情</h3>';
    payrollHtml += calc.staff_info[person].payroll.getHtmlPayroll1();
    payrollHtml += '<h3>收入详情</h3>';
    payrollHtml += calc.staff_info[person].payroll.getHtmlPayroll2();
    payrollHtml += '<center><a href="javascript:hideDiv();">关闭</a></center></div>';
    $("#showdiv").html(payrollHtml);
    $("#showdiv").css("display","block");
}


function hideDiv(){
    // For personal payroll display
    $("#BgDiv").css("display","none");
    $("#showdiv").html('');
    $("#showdiv").css("display","none");
}


function addStaffBtnOnclick() {
    var sname = document.getElementById("sname").value;
    if (sname in calc.staff_info){
        alert("添加员工信息错误: 员工姓名不能重复。");
        document.getElementById("sname").value = "";
        return;
    }
    var post_wage = parseFloat(document.getElementById("post_wage").value);
    if (!post_wage || post_wage < 0){
        alert("添加员工信息错误: 岗位工资格式不符，请重新上传。");
        document.getElementById("post_wage").value = '0';
        return;
    } 
    var performance = document.getElementById("performance").value;
    var housing_rate = parseFloat(document.getElementById("housing_rate").value);
    if (!housing_rate || housing_rate < 0){
        alert("添加员工信息错误: 住房公积金比例格式不符，请重新上传。");
        document.getElementById("housing_rate").value = '0';
        return;
    } 
    
    var person = new Staff(sname, post_wage, performance, housing_rate);
    calc.staff_info[sname] = person;
    Calculator.getPayroll(calc, calc.staff_info[sname]);
    var tableHtml = '<tr><td>'+ sname + '</td><td>'+post_wage+'</td>';
    tableHtml += '<td>' + performance + '</td>';
    tableHtml += '<td>' + housing_rate + '</td>';
    tableHtml += '<td><center><input type="button" name="button" value="查看"  onclick="javascript:showDiv(\''
    tableHtml += person.name+'\');"/></center></td></tr>';
    $('#table_staff tbody').append(tableHtml);
    
    // Clean fields
    document.getElementById("sname").value = "";
    document.getElementById("post_wage").value = '0';
    document.getElementById("housing_rate").value = '0';

}