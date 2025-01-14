const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUserRole.userRole });
    } catch {
      res.status(404);
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404);
    }
  }
  async postSignup(req, res) {
    let { name, email, password, cPassword } = req.body;
    let error = {};
  
    // Check if all fields are provided
    if (!name || !email || !password || !cPassword) {
      error = {
        ...error,
        name: "Field must not be empty",
        email: "Field must not be empty",
        password: "Field must not be empty",
        cPassword: "Field must not be empty",
      };
      return res.json({ error });
    }
  
    // Validate name length
    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be 3-25 characters" };
      return res.json({ error });
    }
  
    // Validate name starts with an alphabet
    if (!/^[A-Za-z]/.test(name)) {
      error = { ...error, name: "Name must start with an alphabetic character" };
      return res.json({ error });
    }
  
    // Validate email
    if (validateEmail(email)) {
      name = toTitleCase(name);

       // Validate email starts with an alphabetic character
  if (!/^[A-Za-z]/.test(email.split('@')[0])) {
    error = { ...error, email: "Email must start with an alphabetic character" };
    return res.json({ error });
  }
  
      // Validate password length
      if (password.length > 255 || password.length < 8) {
        error = {
          ...error,
          password: "Password must be 8 characters",
          name: "",
          email: "",
        };
        return res.json({ error });
      } else {
        // Check if email already exists in database
        try {
          password = bcrypt.hashSync(password, 10);
          const data = await userModel.findOne({ email: email });
          if (data) {
            error = {
              ...error,
              password: "",
              name: "",
              email: "Email already exists",
            };
            return res.json({ error });
          } else {
            let newUser = new userModel({
              name,
              email,
              password,
              // ========= Here role 1 for admin signup role 0 for customer signup =========
              userRole: 0, // Field Name change to userRole from role
            });
            newUser
              .save()
              .then((data) => {
                return res.json({
                  success: "Account created successfully. Please login",
                });
              })
              .catch((err) => {
                console.log(err);
              });
          }
        } catch (err) {
          console.log(err);
        }
      }
    } else {
      error = {
        ...error,
        password: "",
        name: "",
        email: "Email is not valid",
      };
      return res.json({ error });
    }
  }

  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: "Fields must not be empty",
      });
    }
    try {
      const data = await userModel.findOne({ email: email });
      if (!data) {
        return res.json({
          error: "Invalid email or password",
        });
      } else {
        const login = await bcrypt.compare(password, data.password);
        if (login) {
          const token = jwt.sign(
            { _id: data._id, role: data.userRole },
            JWT_SECRET
          );
          const encode = jwt.verify(token, JWT_SECRET);
          return res.json({
            token: token,
            user: encode,
          });
        } else {
          return res.json({
            error: "Invalid email or password",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}

const authController = new Auth();
module.exports = authController;
