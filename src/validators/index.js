import { body } from "express-validator";

const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLowercase()
            .withMessage("username must be in lower case")
            .isLength({ min: 3 })
            .withMessage("username must be atleast 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
        body("fullname")
            .optional()
            .trim()
    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Invalid Email"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ];
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("old password is required"
        ),
    
        body("newPassword")
            .notEmpty
            .withMessage("new Password is required")
    ]
};

const userForgotPasswordValidator = () => {
    return [
        body("Email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid")
    ]
}

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("password is required")
    ]
}

export {
    userRegistrationValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator
}    