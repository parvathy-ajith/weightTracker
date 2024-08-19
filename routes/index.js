var express = require('express');
const multer = require('multer');
const { validationResult, check } = require('express-validator');
const bcrypt = require('bcrypt');
var router = express.Router();
const User = require('../models/userModel');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the isAuthenticated middleware
function isAuthenticated(req, res, next) {
  // Check if the user is authenticated
  if (req.session && req.session.userEmail) {
    // User is authenticated, proceed to the next middleware
    return next();
  }
  // User is not authenticated, render with errors login page
  const errors=[];
  errors.push({ msg: 'LOGIN to access website' });
  res.render('homepage', { username: null, errors: null, display: "loginForm", validationResults: errors}) 
};



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('homepage', { username: req.session.username, errors: null, display: null, validationResults: null });
});

/* GET Dashbord page. */
router.get('/dashboard',isAuthenticated, function (req, res, next) {
  User.findById(req.session.userId).then(foundUser=>{
    res.render('dashboard',{ username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser });
  }).catch(error=>{
    console.error(error);
  });
  
});

/* POST signUp. */
router.post('/signUp', upload.single('profile_picture'), function (req, res, next) {

  const errors = [];

  let { name, email, password, height, initial_weight } = req.body;

  let client = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    height: req.body.height,
    initial_weight: req.body.initial_weight,
  }
  if (req.file) {
    client.profile_picture = req.file.buffer.toString('base64');
  }

  // Create New User Profile
  const newUser = new User(client);

  //Validate the entries
  const validationError = newUser.validateSync();

  if (validationError) {
    res.render('homepage', { username: req.session.username, errors: validationError.errors, display: "signUpForm", validationResults: null });
  } else {
    //find if email is already registered
    User.findOne({ email }).then(existingUser => {
      console.log(existingUser);
      if (existingUser) {
        errors.push({ msg: 'Duplicate email address : email already registred' });
        res.render('homepage', { username: req.session.username, errors: null, display: "signUpForm", validationResults: errors });
      } else {
        return bcrypt.hash(password, 10);
      }
    }).then(hashedPassword => {
      client.password = hashedPassword;
      const signupUser = new User(client);
      // Create a signup user in MongoDB
      signupUser.save()
        .then(() => {
          console.log("saved in DB");
          res.render('homepage', { username: req.session.username, errors: null, display: "loginForm", validationResults: null });
        })
        .catch((error) => {
          console.error(error);
        });

    }).catch((error) => {
      console.error(error);
    });

  }

});

/* POST LOGIN */
router.post('/login', [
  // Validation rules 
  check('loginEmail').notEmpty().withMessage('Enter registered email address'),
  check('loginEmail').isEmail().withMessage('Invalid email address'),
  check('loginPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], function (req, res, next) {
  const errors = [];
  // Validate the request
  const validationResults = validationResult(req);
  console.log(validationResults);
  if (!validationResults.isEmpty()) {
    res.render('homepage', { username: req.session.username, errors: null, display: "loginForm", validationResults: validationResults.array() });
  } else {
    // No validation errors, proceed with authentication
    let { loginEmail, loginPassword } = req.body;
    let foundUser; // Declare foundUser here

    User.findOne({ email: loginEmail }).then(user => {
      if (!user) {
        errors.push({ msg: 'Incorrect Email Address : No such email-ID registred' });
        return res.render('homepage', { username: req.session.username, errors: null, display: "loginForm", validationResults: errors });
      }
      foundUser = user; // Assign user to foundUser
      return bcrypt.compare(loginPassword, user.password);
    }).then(isPasswordValid => {
      if (!isPasswordValid) {
        errors.push({ msg: 'Incorrect Password' });
        return res.render('homepage', { username: req.session.username, errors: null, display: "loginForm", validationResults: errors });
      }

      // Set user's ID and email in the session
      req.session.userId = foundUser._id;
      req.session.userEmail = foundUser.email;
      req.session.username = foundUser.name;
      req.session.weightEntrycount = 0;
      //Set count of weight entries today
      const today = new Date().toDateString();
      for (let index = 0; index < foundUser.weightEntries.length; index++) {
        if (foundUser.weightEntries[index].created_at.toDateString() == today) {
          req.session.weightEntrycount = 1;
        }
      }

      res.render('dashboard', { username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser });

    }).catch((error) => {
      console.error(error);
    });
  }
});

/* GET logout */
router.get('/logout', function (req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.send('Error')
    } else {
      res.redirect('/')
    }
  });
});

/* POST Log Weight */
router.post('/logWeight', function (req, res, next) {
  //find user by ID
  User.findById(req.session.userId).then(foundUser => {
    console.log("User Name : " + foundUser.name)
    //push weight data into array
    foundUser.weightEntries.push({ weight: req.body.weight });
    console.log(foundUser.weightEntries)
    //save updated user
    foundUser.save().then(() => {
      req.session.weightEntrycount++;
      console.log(req.session.weightEntrycount);
      res.render('dashboard', { username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser });
    }).catch((error) => {
      console.error(error);
    });
  }).catch((error) => {
    console.error(error);
  });
});

/* GET enter Weight */
router.get('/weight/delete', function (req, res, next) {
  let index = req.query.index;

  User.findById(req.session.userId).then(foundUser => {
    //remove the weight entry at corresponding index
    foundUser.weightEntries.splice(index, 1);
    //Set count of weight entries today
    const today = new Date().toDateString();
    req.session.weightEntrycount = 0;
    for (let index = 0; index < foundUser.weightEntries.length; index++) {
      if (foundUser.weightEntries[index].created_at.toDateString() == today) {
        req.session.weightEntrycount = 1;
      }
    }
    foundUser.save().then(() => {
      res.render('dashboard', { username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser });
    }).catch((error) => {
      console.error(error);
    });
  });

});

/* POST UPDATE Weight */
router.post('/weight/edit', function (req, res, next) {
  var { editedWeight } = req.body;
  let index = req.query.index;

  User.findById(req.session.userId).then(foundUser => {
    //updating weight
    foundUser.weightEntries[index].weight = editedWeight;
    foundUser.save().then(() => {
      res.render('dashboard', { username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser });
    }).catch(error => {
      console.error(error);
    });

  }).catch((error) => {
    console.error(error);
  });
})

/*POST compare weights on dates*/
router.post('/compareweight', function (req, res, next) {
  var { startDate, endDate } = req.body;
  var startWeight, endWeight;
  if (startDate == endDate) {
    res.status(200).json({ message: 'Same dates selected. No change in weight!!!!' });
  } else {
    User.findById(req.session.userId).then(foundUser => {
      //comparing weight
      for (let index = 0; index < foundUser.weightEntries.length; index++) {
        var date = foundUser.weightEntries[index].created_at.toDateString();
        if (startDate == date) {
          startWeight = foundUser.weightEntries[index].weight;
        }
        else if (endDate == date) {
          endWeight = foundUser.weightEntries[index].weight;
        }
      }
      let sDate = Date.parse(startDate);
      let eDate = Date.parse(endDate);
      if (sDate < eDate) {
        result = startWeight - endWeight;
        result = result.toFixed(2);
        if (result < 0) {
          console.log(`You have gained ${Math.abs(result)} kg weight`);
          res.status(200).json({ message: `You have gained ${Math.abs(result)} kg weight` });
        } else if (result > 0) {
          console.log(`You have lost ${Math.abs(result)} kg weight`);
          res.status(200).json({ message: `You have lost ${Math.abs(result)} kg weight` });
        }
      } else if (sDate > eDate) {
        result = startWeight - endWeight;
        result = result.toFixed(2);
        if (result > 0) {
          console.log(`You have gained ${Math.abs(result)} kg weight`);
          res.status(200).json({ message: `You have gained ${Math.abs(result)} kg weight` });
        } else if (result < 0) {
          console.log(`You have lost ${Math.abs(result)} kg weight`);
          res.status(200).json({ message: `You have lost ${Math.abs(result)} kg weight` });
        }
      }
    }).catch((error) => {
      console.error(error);
    });
  }
});

/* GET pagination page */
router.get('/paginationDashboard', function (req, res, next) {
  var query = { email: req.session.userEmail };
  // const options = {
  //   page: 1,
  //   limit: 3,
  // };
  var option = {
    select: 'weightEntries',
    pagingOptions: {
      populate: {
        path: 'weightEntries'
      },
      page: 1,
      limit: 3,
    },
  };
 
  User.paginateSubDocs(query, option) .then(result => {
    console.log(result);
    console.log(result.prevPage );
    res.render('pagination', { username: req.session.username, weightEntrycount: req.session.weightEntrycount, foundUser :result.weightEntries.docs,pagination:result});
  })
  .catch(error => {
    console.error(error);
    res.status(500).send('Internal Server Error');
  });
});



module.exports = router;
