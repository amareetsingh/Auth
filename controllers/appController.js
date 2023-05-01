import UserModel from "../model/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ENV from "../config.js";

import otpGenerator from "otp-generator";
import Package from "../model/Package.model.js";
import Stripe from "stripe";
const stripe = new Stripe(
  "sk_test_51MmypUSIVChpnvMqKRIcVKN7H2jDO7lFw12F6gDht9vibcfPg7JKFqJaDepfV0gmEosbcA4vU7TfAzEyj1shtRxy00tm9Krpdr"
);

import ChatList from "../model/ChatList.model.js";
import ChatHistoryModel from "../model/ChatHistory.model.js";
import PaySchema from "../model/Payment.model.js";

/** middleware for verify user */
export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method == "GET" ? req.query : req.body;

    // check the user existance
    let exist = await UserModel.findOne({ username });
    if (!exist) return res.status(404).send({ error: "Can't find User!" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

export async function register(req, res) {
  try {
    const {
      username,
      password,
      profile,
      email,
      address,
      mobile,
      lastName,
      firstName,
    } = req.body;

    const customer = await stripe.customers.create({ email });

    // check the existing user
    const existUsername = new Promise((resolve, reject) => {
      UserModel.findOne({ username }, function (err, user) {
        if (err) reject(new Error(err));
        if (user) reject({ error: "Please use unique username" });

        resolve();
      });
    });

    // check for existing email
    const existEmail = new Promise((resolve, reject) => {
      UserModel.findOne({ email }, function (err, email) {
        if (err) reject(new Error(err));
        if (email) reject({ error: "Please use unique Email" });

        resolve();
      });
    });

    Promise.all([existUsername, existEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const user = new UserModel({
                username,
                password: hashedPassword,
                profile: profile || "",
                email,
                address,
                mobile,
                lastName,
                firstName,
                stripeCustomerId: customer.id,
              });

              // return save result as a response
              user
                .save()
                .then((result) =>
                  res.status(201).send({ msg: "User Register Successfully" })
                )
                .catch((error) => res.status(500).send({ error }));
            })
            .catch((error) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        }
      })
      .catch((error) => {
        return res.status(500).send({ error });
      });
  } catch (error) {
    return res.status(500).send(error);
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    UserModel.findOne({ username })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck)
              return res.status(400).send({ error: "Don't have Password" });

            // create jwt token
            const token = jwt.sign(
              {
                userId: user._id,
                username: user.username,
              },
              ENV.JWT_SCREET,
              { expiresIn: "24h" }
            );

            return res.status(200).send({
              msg: "Login Successful...!",
              username: user.username,
              token,
            });
          })
          .catch((error) => {
            return res.status(400).send({ error: "Password does not Match" });
          });
      })
      .catch((error) => {
        return res.status(404).send({ error: "Username not Found" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
}

export async function getUser(req, res) {
  const { username } = req.params;

  try {
    if (!username) return res.status(501).send({ error: "Invalid Username" });

    UserModel.findOne({ username }, function (err, user) {
      if (err) return res.status(500).send({ err });
      if (!user)
        return res.status(501).send({ error: "Couldn't Find the User" });

      /** remove password from user */
      // mongoose return unnecessary data with object so convert it into json
      const { password, ...rest } = Object.assign({}, user.toJSON());

      return res.status(201).send(rest);
    });
  } catch (error) {
    return res.status(404).send({ error: "Cannot Find User Data" });
  }
}

export async function updateUser(req, res) {
  try {
    // const id = req.query.id;
    const { userId } = req.user;
console.log('useid', userId)
    if (userId) {
      const body = req.body;

      // update the data
      UserModel.updateOne({ _id: userId }, body, function (err, data) {
        if (err) throw err;

        return res.status(201).send({ msg: "Record Updated...!" });
      });
    } else {
      return res.status(401).send({ error: "User Not Found...!" });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
}

/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).send({ msg: "Verify Successsfully!" });
  }
  return res.status(400).send({ error: "Invalid OTP" });
}

// successfully redirect user when OTP is valid

export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    return res.status(201).send({ flag: req.app.locals.resetSession });
  }
  return res.status(440).send({ error: "Session expired!" });
}

// update the password when we have valid session
export async function resetPassword(req, res) {
  try {
    if (!req.app.locals.resetSession)
      return res.status(440).send({ error: "Session expired!" });

    const { username, password } = req.body;

    try {
      UserModel.findOne({ username })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              UserModel.updateOne(
                { username: user.username },
                { password: hashedPassword },
                function (err, data) {
                  if (err) throw err;
                  req.app.locals.resetSession = false; // reset session
                  return res.status(201).send({ msg: "Record Updated...!" });
                }
              );
            })
            .catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not Found" });
        });
    } catch (error) {
      return res.status(500).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

export async function getPackages(req, res) {
  try {
    try {
      const response = await Package.find();
      res.status(200).json({ success: true, response });
    } catch (error) {
      res.status(400).json({ success: false, error });
    }
  } catch (error) {}
}

// stripe payment

export async function stripePayment(req, res) {
  const { item, token } = req.body;
  console.log("item", item);
  console.log("ittokeem", req.cookies);
  const customerId = await stripe.customers.create({
    name: item.name,
    email: token.email,
  });

  stripe.paymentIntents
    .create({
      payment_method_types: ["card"],
      amount: item.price, // Charging Rs 25
      description: `Purchased the package2 ${item.name}`,
      currency: "INR",
      customer: customerId.id,
    })
    .then((charge) => {
      const user = new PaySchema({
        email: token.email,
        name: item.name,
        price: item.price,
        features: item.features,
        package_code: token.id,
        count_limit: item.count_limit,
      });

      const userRegister = user.save();
      const paytoken = token.id;
      res.cookie("payToken", paytoken, {
        expires: new Date(Date.now() + 15000000),
        httpOnly: true,
      });

      res.status(200).json({ success: true, user, charge, paytoken });
    })
    .catch((err) => {
      res.send(err);
    });
}

// // chathistory

export async function chathistory(req, res) {
  const {
    chat_id,
    chat_name,
    response_text,
    generate_word,
    chat_max_tokens,
    chat_industry,
  } = req.body;
  try {
    const newChatHistory = new ChatHistoryModel({
      chat_id,
      chat_name,
      response_text,
      generate_word,
      chat_max_tokens,
      chat_industry,
    });

    const chathistory = newChatHistory.save();
    res.status(200).send("new Chat history successfuly created ");
  } catch (error) {
    res.status(400).json(error);
  }
}

// // chatlist

export async function chatlist(req, res) {
  const { chat_id, chat_name, username } = req.body;
  try {
    const newChatList = new ChatList({
      username,
      chat_id,
      chat_name,
    });

    const chatList = newChatList.save();
    res.status(200).send("new Chat list successfuly created ");
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function getchathistory(req, res) {
  try {
    const chathistory = await ChatHistoryModel.findOne({
      chat_id: req.body.chat_id,
    });
    if (chathistory) {
      res.status(200).send(chathistory);
    } else {
      res.status(422).send("chat history not found");
    }
  } catch (error) {
    res.status(400).send(error);
  }
}
export async function getchatlist(req, res) {
  try {
    const { username } = req.body;
    // const token = req.cookies.jwtoken;

    const response = await ChatList.find({ username: username });
    res.send(response);
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function getPaymentDetalis(req, res) {
  try {
    const { email } = req.body;
    // res.setHeader();
    // const token = req.cookies.jwtoken;
    const doc = await PaySchema.find({email:email}).sort({$natural:-1}).limit(1);

    if (!doc) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, doc });
  } catch (error) {
    return res.status(400).send(error);
  }
}
