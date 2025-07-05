
const issueForm = document.querySelector('#issueForm')
const imageInput = document.querySelector('#imageUpload');
const imagePreview = document.querySelector('#imagePreview');
const userlocation = document.querySelector('#userlocation');
const getLocationBtn = document.querySelector('#getLocationBtn');
const submitButton = document.querySelector('.submit-btn');
const popUp = document.querySelector(".popUp");
const okayBtn = document.querySelector(".popUp .btn button");
const DisplayIssue = document.querySelector(".DisplayIssue");



imageInput.addEventListener('change',function(){
    const file = this.files[0];
    if(file && file.type.startsWith('image/')){
        const reader = new FileReader();

        reader.onload = function (e) {
            imagePreview.innerHTML = '';

            // Create image element
            const img = document.createElement('img');
            img.src = e.target.result;

            imagePreview.appendChild(img);   
        };

        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '<p>Please select a valid image file.</p>';
    }
});

const getUserCurrentAddress = async (latitude, longitude) =>{

    const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=6011e9cf551a4e1c900752079f232fe8`;
    try{
      const res = await fetch(apiUrl);
      const data = await res.json();
      console.log(data);
      const{road,road_type,city,postcode,state,country} = data.results[0].components;
      userlocation.value = `${road},${road_type},${city},${postcode},${state},${country}`;
    } 
       catch (error){
          console.log(error);
       }

}
getLocationBtn.addEventListener('click',()=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition((position)=>{
            // console.log(position.coords.latitude)
              const {latitude,longitude}=position.coords;
             userlocation.value=`latitude=${latitude},longitude=${longitude}`

             getUserCurrentAddress(latitude, longitude)
         },
            (error)=>{
             console.log("error")
             userlocation.value="unable to fetch"
        })
    }
})


 document.addEventListener("DOMContentLoaded", function () {
    
    popUp.style.display = "none";
    issueForm.addEventListener("submit", function (e) {
        e.preventDefault();

        //  add validation here if needed

    
        popUp.style.display = "flex";

        issueForm.reset();
        imagePreview.innerHTML = '';
    });

    okayBtn.addEventListener("click", function () {
        popUp.style.display = "none";
    });
});
