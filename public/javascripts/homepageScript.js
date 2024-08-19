const btn = document.getElementById("calculate");

btn.addEventListener("click", function () {
  let height = document.querySelector("#heightBMI").value;
  let weight = document.querySelector("#weightBMI").value;

  if (height == "" || weight == "") {
    alert("Please fill out the Height(cm) and Weight(Kg)!");
    return;
  }

  // BMI = weight in KG / (height in m * height in m)

  height = height / 100;

  let BMI = weight / (height * height);

  BMI = BMI.toFixed(2);

  document.querySelector("#result").innerHTML = BMI;

  let status = "";

  if (BMI < 18.5) {
    status = "Underweight";
  }
  if (BMI >= 18.5 && BMI < 25) {
    status = "Healthy";
  }
  if (BMI >= 25 && BMI < 30) {
    status = "Overweight";
  }
  if (BMI >= 30) {
    status = "Obese";
  }
  document.querySelector(
    ".comment"
  ).innerHTML = `<span class="mb-3" >You are <span id="comment" class="fs-5 fw-bold">${status}</span></span>
                <p class="mb-0">Don't have an account to track your weight? <a href="#signUp-btn" class="fw-bold" onclick="return showSignUpForm()">Sign Up</a></p>
                <p class="mb-0">Already a User? Log in to track your weight <a href="#login-btn" class="fw-bold" onclick="return showLoginForm()">Login</a></p>
                `;
});


function showSignUpForm(){
    document.getElementById("signUpForm").style.display="block";
    document.getElementById("loginForm").style.display="none";
    document.getElementById("BMICalculator").style.display="none";
    document.getElementById("errors").style.display="none";
    return true;
}

function showLoginForm(){
    document.getElementById("loginForm").style.display="block";
    document.getElementById("signUpForm").style.display="none";
    document.getElementById("BMICalculator").style.display="none";
    document.getElementById("errors").style.display="none";
    return true;
}