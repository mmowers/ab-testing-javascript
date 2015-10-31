(function(){

//----------------------Tests-----------------------------------//

var abTests = [];

//ENTER YOUR TESTS HERE

//Example tests 1
abTests.push({
  name: "change_signup",
  conditions: ["not_lt_IE9"],
  experiences: [{
    name: "control",
    script: "none",
    fraction: 1/4
  },{
    name: "change_signup_text",
    script: "change_signup_text",
    fraction: 1/4
  },{
    name: "change_signup_button",
    script: "change_signup_button",
    fraction: 1/4
  },{
    name: "hide_signup_button",
    script: "hide_signup_button",
    fraction: 1/4
  }]
});

//Example test 2
abTests.push({
  name: "business_redirect",
  conditions: ["US_pricing","not_lt_IE9"],
  experiences: [{
    name: "control",
    script: "none",
    fraction: 0.5
  },{
    name: "business_redirect",
    script: "business_redirect",
    fraction: 0.5
  }]
});

//----------------------Condition Scripts--------------------------//
var abConditions = {
  //ENTER YOUR CONDITIONS HERE

  //Example Conditions:
  US_home: function (){ return window.location.pathname == '/' || window.location.pathname == '/home/'; },
  US_pricing: function(){ return /^\/pricing\//i.test(window.location.pathname); },
  isIE: function() { return (navigator.userAgent.toLowerCase().indexOf('msie') != -1) ? parseInt(navigator.userAgent.toLowerCase().split('msie')[1]) : false; },
  not_lt_IE9: function(){ return !(this.isIE() && this.isIE() < 9); },
  none: function (){ return true; }
};


//----------------------Experience Scripts--------------------------//
var abExperiences={
  //ENTER YOUR EXPERIENCES HERE

  //Example Experiences
  business_redirect: function (){
    window.location.replace(window.location.protocol+'//'+window.location.host+'/business/');
    document.write("<style>html { display:none; }</style>"); //to prevent flashing of the page
  },

  hide_signup_button: function (){
    document.write("<style>.sign-up-button { display:none !important; }</style>");
  },

  change_signup_text: function (){
    document.write("<style>.sign-up-button a { visibility:hidden; }</style>");
    document.addEventListener("DOMContentLoaded", function(event) { 
      jQuery('.sign-up-button a').text('Pricing');
      jQuery('.sign-up-button a').css('visibility','visible');
    });
  },

  change_signup_button: function (){
    document.write("<style>.sign-up-button { visibility:hidden; }</style>");
    document.addEventListener("DOMContentLoaded", function(event) { 
      jQuery('.sign-up-button').html('<a href="/business/">Sign up Now</a>');
      jQuery('.sign-up-button').css('visibility','visible');
    });
  }
};


//--------------------------------------------------------------------------------//
//------------------ End of Test Configuration------------------------------------//
//--------------------------------------------------------------------------------//



/*

Taken from https://developer.mozilla.org/en-US/docs/Web/API/document.cookie, and modified for abtest cookies

|*|  Syntaxes:
|*|
|*|  * abCookies.setCookie(name, value[, end[, path[, domain[, secure]]]])
|*|  * abCookies.getCookie(name)
|*|  * abCookies.removeInactive()
*/
var abCookiePrefix = 'abtest_';
var defaultDomain = document.domain;
var abCookies = {
  getCookie: function (sKey) {
    if (!sKey) { return null; }
    abKey = abCookiePrefix + sKey;
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(abKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setCookie: function (sKey, sValue, days) {
    abKey = abCookiePrefix + sKey;
    document.cookie = encodeURIComponent(abKey) + "=" + encodeURIComponent(sValue) + "; max-age=" + days*24*60*60 + "; domain=" + defaultDomain + "; path=/" + "; secure";
    return true;
  },
  removeInactive: function () {
    var abCookieRE = new RegExp(abCookiePrefix+'[^=]*=','g');
    if (!abCookieRE.test(document.cookie)) { return false; }
    var cookieArray = document.cookie.match(abCookieRE);
    outerLoop:
    for(var i = 0; i < cookieArray.length; i++){
      testKey = cookieArray[i];
      testKey = testKey.replace('=','');
      testKeyNoPrefix = testKey.replace(abCookiePrefix,'');
      for(var j = 0; j < abTests.length; j++){
        if(abTests[j].name == testKeyNoPrefix){
          continue outerLoop;
        }
      }
      document.cookie = encodeURIComponent(testKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT"  + "; domain=" + defaultDomain + "; path=/";
    }
    return true;
  },
};

abCookies.removeInactive(); //clean up cookies from inactive tests. Comment to remove this functionality


//--------------------End Cookie functions-------------------------------------//


//--------Core functionality: determine scripts to run and set cookies---------//

var userExperiences = []; //this holds all of the scripts to be run for this user.

//Filter out the tests where any of the conditions of the test don't pass. All conditions must pass for the test to be applied.
var filteredTests = [];
for(var i = 0; i < abTests.length; i++){
  for(var j = 0; j < abTests[i].conditions.length; j++){
    var funcString = abTests[i].conditions[j];
    if(typeof abConditions[funcString] !== 'function' || !abConditions[funcString]()) {
      break;
    }
  }
  if(j == abTests[i].conditions.length){ //this means we've passed all the conditions for this test
    filteredTests.push(abTests[i]);
  }
}

/*
Loop through each test.

If this user has a cookie for the test, then add the experience
script to userExperiences.

If there is no cookie, then generate a random number to determine
what experience the user should be in, if any. If the user enters an experience,
cookie that experience, and add the experience script to userExperiences
*/
for(var i = 0; i < filteredTests.length; i++){
  if(abCookies.getCookie(filteredTests[i].name)){
    for(var j = 0; j < filteredTests[i].experiences.length; j++){
      if(abCookies.getCookie(filteredTests[i].name) == filteredTests[i].experiences[j].name){
        userExperiences.push(filteredTests[i].experiences[j].script);
        break;
      }
    }
  }
  else{
    var randomNum = Math.random();
    var fractionSum = 0;
    for(var j = 0; j < filteredTests[i].experiences.length; j++){
      if(randomNum >= fractionSum && randomNum < fractionSum + filteredTests[i].experiences[j].fraction){
        abCookies.setCookie(filteredTests[i].name,filteredTests[i].experiences[j].name,60);
        userExperiences.push(filteredTests[i].experiences[j].script);
        break;
      }
      fractionSum += filteredTests[i].experiences[j].fraction;
    }
  }
}


//execute all the scripts for all the experiences the user is in
for(var i = 0; i < userExperiences.length; i++){
  var funcString = userExperiences[i];
  if(typeof abExperiences[funcString] === 'function') {
    abExperiences[funcString]();
  }
}

})();