var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}

window.onscroll = function() {
  navOff();
};

let nav = document.getElementById("navbar");
let content = document.getElementById("wrapper");
let offset = nav.offsetTop;
function navOff() {
   if (window.pageYOffset >= offset) {
    nav.classList.add("nav-top");
    content.classList.add("wrapper");
  } else {
    nav.classList.remove("nav-top");
    content.classList.remove("wrapper");
  }
}