var nameplate = document.getElementsByClassName('name-plate')[0];
var profile_pic = document.getElementsByClassName('profile-img')[0];
TweenLite.from(nameplate, 2, {opacity:0});
TweenLite.from(profile_pic, 1, {opacity:0, right:"150px"});
