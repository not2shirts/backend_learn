import User from "../model/User.model.js";
import crypto from "crypto";
import createTransporter from "../utils/mail.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// dotenv.config()


const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
}

const registerUser = async (req, res) => {


    //get data
    // validate
    //check if user already exists
    // create user
    //create a verification token
    // save token in database
    // send token as email to user to verify
    // send success status to user


    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
    }

    try {

        const user = await User.create({
            name,
            email,
            password
        })

        if (!user) {
            return res.json({ message: "Error registering user" })

        }

        const token = generateToken()
        user.verificationToken = token
        await user.save()


        const transporter = createTransporter()

        const mailOption = {
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject: "Verify your email",
            text: `Please click on the following link:
     ${process.env.BASE_URL}/api/v1/user/verify/${token}
      `,
        };

        try {
            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOption, (err, info) => {
                    if (err) {
                        console.log("Mail Error:", err.message);
                        reject(err);
                    } else {
                        console.log("Message sent: %s", info.messageId);
                        resolve(info);
                    }
                });
            });

            return res.status(200).json({
                message: "User registered successfully. Please check your email to verify your account.",
                success: true
            });
        } catch (mailError) {
            console.error("Mail sending failed:", mailError);
            // Delete the user if email fails
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({
                message: "Failed to send verification email. Please try again.",
                success: false
            });
        }




    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message: "Failed to register user",
            success: false
        })
    }







};


const verifyUser = async (req, res) => {

    //get token from url
    //validate
    //find user from databse with verificationtoken
    // if user not found return error
    // if user found update isVerified to true
    // delete token from feild
    //save
    // send success response

    const { token } = req.params

    if (!token) {
        return res.status(400).json({ message: "Invalid token" })
    }
    try {

        const user = await User.findOne({ verificationToken: token })
        if (!user) {
            return res.status(404).json({ message: "Token not Found" })
        }
        console.log(user)
        user.isVerified = true
        user.verificationToken = undefined
        await user.save()

        return res.status(200).json({ message: "User verified successfully" })
    } catch (error) {
        console.error("VERIFICATION ERROR:", error);
        return res.status(500).json({
            message: "Failed to verify user",
            success: false
        })

    }



}

const loginUser = async (req, res) => {




    //get data
    //validate
    //check if user exist in the db
    // match the password with the hash pswd in the db
    // if everything is right create a jwt token
    // send the jwt in cookie to browser
    // send success status along with token

    try {

        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "All feilds are required" })
        }


        const user = await User.findOne({ email })
        // console.log(user)
        if (!user) {
            return res.status(400).json({ message: "Invalid email" })
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "User not verified" })
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return res.status(400).json({ message: "Invalid password" })
        }




        const payload = { id: user._id, role: user.role }
        const secret_key = process.env.JWT_SECRET
        const options = { expiresIn: '24h' }

        const token = jwt.sign(payload, secret_key, options)
        console.log(token)

        const decoded = jwt.decode(token);
        console.log(decoded);


        res.cookie("token", token, {
            httpOnly: true,   // ❌ no JS access
            secure: true,     // ✅ only over HTTPS
            sameSite: "strict" // ✅ CSRF protection
        });

        return res.status(200).json({
            success: true,
            message: `Welcome ${user.name}`,
            user: {
                name: user.name,
                id: user._id,
                role: user.role,
            }
        })


    } catch (error) {
        console.error("Login ERROR:", error);
        return res.status(500).json({
            message: "Failed to log in user",
            success: false
        })

    }

}


const profile = async (req, res) => {

    try {
        const user = req.user

        if (!user) {
            return res.status(400).json({ message: "Couldn't load profile", success: false })
        }



        const userinfo = await User.findById(user.id).select("name email createdAt role")
        if (!userinfo) return res.status(404).json({ success: false, message: "User not found" })
        const { name, email, createdAt, role } = userinfo


        return res.status(200).json({
            success: true, message: "User id successfully found", data: {
                name: name,
                email: email,
                role: role,
                accountCreatedOn: new Date(createdAt).toLocaleString(),

            }
        })

    } catch (error) {
        console.log("Profile Error : ", error)
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }

}


const logout = async (req, res) => {

    res.clearCookie("token")
    return res.status(200).json({ message: "Logged out successfully", success: true })
}



const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const forgotPassword = async (req, res) => {
    // get email from user
    // validate
    // check if user exsists
    //  create a resetpasswdtoken and save in db
    // set expiry time for token
    // send email to user with the token
    // send success response


    try {
        const { email } = req.body

        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address', message: "Enter a valid email" });
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        }

        const token = generateToken()

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + (24 * 60 * 60 * 1000)
        await user.save()

        const transporter = createTransporter()

        const mailOption = {
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject: "Reset ypur password",
            text: `Please click on the following link:
         ${process.env.BASE_URL}/api/v1/user/reset/${token}
          `,
        };

        transporter.sendMail(mailOption);
        return res.status(200).json({ message: "Email sent successfully. Please check your email", success: true })

    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "FORGOT PASSWORD ERROR" })
    }



}

const resetPassword = async (req, res) => {
    try {

        const { password } = req.body
        const { token } = req.params


        const user = await User.findOne(
            {
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            }
        )
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" })
        }

        user.password = password
        user.resetPasswordToken = null
        user.resetPasswordExpires = null
        await user.save()
        return res.status(200).json({ message: "Password reset successfully", success: true })

    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "User doesn't exist", success: false })
    }

}

const greetings = (req, res) => {
    res.send("Welcome User")
}

export { registerUser, greetings, verifyUser, loginUser, profile, logout, forgotPassword, resetPassword }
