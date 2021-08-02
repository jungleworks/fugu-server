

exports.getCurrentDay         = getCurrentDay;
exports.getDaysinMonth        = getDaysinMonth;


function getCurrentDay(date){
  return date.getDate();
}

function getDaysinMonth(anyDateInMonth) {
  return new Date(anyDateInMonth.getFullYear(),
    anyDateInMonth.getMonth()+1,
    0).getDate();
}