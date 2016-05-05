// Author: Siting Ren
// Version: 2016-05-05

function Staff(staff_name, post_wage, performance, housing_rate){
    this.name = staff_name;
    this.post_wage = post_wage;
    this.performance = performance;
    this.housing_rate = housing_rate;
    this.payroll = {};
}
Staff.prototype.constructor = Staff;