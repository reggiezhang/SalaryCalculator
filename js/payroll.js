// Author: Siting Ren
// Version: 2016-05-05

function Payroll(insurance_org, insurance_indv, post_wage, 
                 performance_pay, pretax_income, tax, aftertax_income){    
    this.displayOrder = [['pension', '养老'], ['medical', '医疗'], ['unemployment', '失业'], ['maternity', '生育'], ['injury', '工伤'], ['housing', '住房'], ['subtotal', '总计']];
    // Insurance and Housing payment by organization
    this.insurance_org = insurance_org;
    // Insurance and Housing payment by individual
    this.insurance_indv = insurance_indv;
    // The salary consists of post wage and performance pay.
    this.post_wage = post_wage;
    this.performance_pay = performance_pay;
    // Pre-tax income, tax and after-tax income
    this.pretax_income = pretax_income;
    this.tax = tax;
    this.aftertax_income = aftertax_income;
}
Payroll.prototype.constructor = Payroll;
Payroll.prototype.getHtmlPayroll1 = function (){
    tableHtml = '<table id="table_payroll1" border="1">';
    tableHtml += '<thead><tr><th> </th><th>个人</th>';
    tableHtml += '<th>单位</th></tr></thead><tbody>';
    for (var i = 0; i < this.displayOrder.length; i++){
        tableHtml += '<tr><td>' + this.displayOrder[i][1] + '</td>';
        tableHtml += '<td>' + this.insurance_indv[this.displayOrder[i][0]] + '</td>';
        tableHtml += '<td>' + this.insurance_org[this.displayOrder[i][0]] + '</td>';
        tableHtml += '</tr>';
    }   
    tableHtml += '</tbody></table>';
    return tableHtml;
}
Payroll.prototype.getHtmlPayroll2 = function (){
    tableHtml = '<table id="table_payroll2" border="1">';
    tableHtml += '<thead><tr><th>岗位工资</th><th>绩效工资</th>';
    tableHtml += '<th>五险一金(个人)</th><th>五险一金(单位)</th>';
    tableHtml += '<th>税前收入</th><th>扣税</th><th>税后收入</th>';
    tableHtml += '</tr></thead><tbody><tr>';
    tableHtml += '<td>' + this.post_wage + '</td>';
    tableHtml += '<td>' + this.performance_pay + '</td>';
    tableHtml += '<td>' + this.insurance_indv.subtotal + '</td>';
    tableHtml += '<td>' + this.insurance_org.subtotal + '</td>';
    tableHtml += '<td>' + this.pretax_income + '</td>';
    tableHtml += '<td>' + this.tax + '</td>';
    tableHtml += '<td>' + this.aftertax_income + '</td>'; 
    tableHtml += '</tr></tbody></table>';
    return tableHtml;
}