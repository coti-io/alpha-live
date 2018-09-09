window.onload = function(){
  window.onresize = function () {
      document.getElementsByTagName('canvas')[0].parentNode.style.width = '90%';
      document.getElementsByTagName('canvas')[0].parentNode.style.height = 'auto';
      document.getElementsByTagName('canvas')[0].style.width = '90%';
      document.getElementsByTagName('canvas')[0].style.height = 'auto';
    };
}