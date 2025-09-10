import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isLoggedin = (req, res, next) => {

    try {

        const token = req.cookies.token || ""

        console.log("Token Found : ", token ? "yes" : "no")

        if (!token) {
            return res.status(400).json({
                message: "Auth Failed",
                success: false,

            })
        }
        // console.log("JWT_SECRET:", process.env.JWT_SECRET );
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = decoded;
        next();

    } catch (error) {
        console.log("AUTH MIDDLEWARE ERROR:", error);
        return res.status(500).json({ message: "Unauthorized" });
    }



}


export { isLoggedin }
