var userSetPassword = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">
 
    <title>Fugu Chat</title>
    <!--<style>
       @media(max-width: 991px){
       table{width: 100%!important; max-width: 350px!important;}
       .styl-yes{font-size: 20px!important; line-height: 22px!important;}
 
 
       }
 
 
    </style>-->
 
    <style type="text/css">
 
 
 
        /* Base styles */
        *, *:after, *:before {
            box-sizing: border-box;
        }
 
        img {
            vertical-align: middle;
            max-width: 100%;
        }
        button {
            cursor: pointer;
            border: 0;
            padding: 0;
            background-color: transparent;
        }
 
        .container{
            width: 100%;
            display: inline-block;
            text-align: left;
            padding: 0px 35px;
            background-color: #fff;
            margin-top: 20px;
            margin-bottom: 0px;
            border: 1px solid #dde5ed;
            box-sizing: border-box;
        }
        .heading-container{
            width: 100%;
            display: table;
 
            border-bottom: 1px solid #ccc;
            box-sizing: border-box;
        }
 
        /* Form */
        .field {
            position: relative;
            margin-bottom: 2em;
        }
        .label {
            position: absolute;
            height: 2rem;
            line-height: 2rem;
            bottom: 0;
            color: #999;
            transition: all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .input {
            width: 100%;
            font-size: 100%;
            border: 0;
            padding: 0;
            background-color: transparent;
            height: 2rem;
            line-height: 2rem;
            border-bottom: 1px solid #eee;
            color: #777;
            transition: all .2s ease-in;
        }
        .input:focus {
            outline: 0;
            border-color: #ccc;
        }
 
        /* Using required and a faux pattern to see if input has text from http://stackoverflow.com/questions/16952526/detect-if-an-input-has-text-in-it-using-css */
        .input:focus + .label,
        input:valid + .label {
            transform: translateY(-100%);
            font-size: 0.75rem;
            color: #6380e0;
        }
 
        /* Button */
        .btn {
            border: 0;
            font-size: 0.9rem;
            height: 3.5rem;
            line-height: 2.5rem;
            padding: 0 1.5rem;
            text-transform: uppercase;
            border-radius: .25rem;
            letter-spacing: .2em;
            transition: background .2s;
            width : 100%;
            opacity: .7;
            background-color : #6380e0;
            color : #ffffff;
            font-family: sans-serif;
        }
        .btn:focus {
            outline: 0;
        }
        .btn:hover,
        .btn:focus {
            background: #6380e0 ;
            opacity: 1;
        }
 
 
        /* Intro animation */
        @keyframes intro {
            from {
                opacity: 0;
                top: 0;
            }
            to {
                opacity: 1;
                top: 50%;
            }
        }
 
        /*@media(min-width: 768px){
           table{max-width: 600px!important}
 
        .smal-pad{padding:0px 35px!important;}
        */
        .paragraph {
            font-size: 20px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            line-height: 28px;
            padding: 20px 0px;
            margin: 0px;
            color: #637280;
        }
        .heading {
            font-size: 20px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            line-height: 28px;
            padding: 30px 0px;
            margin: 0px;
            color: #6380e0;
        }
        td {
            padding: 10px;
        }
        input:focus,
        select:focus,
        textarea:focus,
        button:focus {
            outline: none;
        }
        table{max-width:600px; width:100%; }
 
 
        @media (max-width: 786px){
 
            table{max-width:350px; width:100%; }
            .smal-pad{padding:0px 15px!important;}
            .font-small{font-size: 18px!important}
 
        }
    </style>
    <Script>
        var validation = function(){
            var password = document.getElementById('fieldUser').value;
            var confirmPassword = document.getElementById('fieldPassword').value;
            if(password != confirmPassword){
                alert("Password is not Same");
                return false;
            }
            return true;
        }
    </Script>
</head>
<body >
<table style="text-align:left; border:none; margin:auto; padding-top:10px; background-color:#fff;  border-spacing: 0px; "   border="0" cellpadding="0" cellspacing="0">
    <tr>
        <td>
            <p style="margin: 0px"><img src="https://fuguchat.s3.ap-south-1.amazonaws.com/default/7zwNFgy312_1518070410530.png" width="150"/></p>
        </td>
    </tr>
    <tr>
        <td style="text-align:center;">
            <div class="container">
                <div class="heading-container">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="paragraph">You have been invited to join the {{{business_name}}} on FuguChat.</p>
                    </div>
                </div>
                <div style="padding:0px 0px; font-family: sans-serif;">
                    <centre><p class="heading">SET PASSWORD</p></centre>
                    <div>
                        <div>
                            <form action="{{{url}}}" method="post" onsubmit="return validation()" >
                                <p style="display: none;"><input type="text" name="email_token" value="{{{email_token}}}" size="30"
                                                                 maxlength="25"></p>
                                <p style="display: none;"><input type="text" name="domain" value="{{{domain}}}" size="30"
                                                                 maxlength="25"></p>
                                <div>
                                    <div class="field">
                                        <input type="password" id="fieldUser"  name='password' class="input" minlength="6" maxlength="25" required  />
                                        <label for="fieldUser" class="label">Enter Password</label>
                                    </div>
                                    <div class="field">
                                        <input type="password" id="fieldPassword" class="input"  minlength="6" maxlength="25" required/>
                                        <label for="fieldPassword" class="label">Confirm Password</label>
                                    </div>
                                </div>
                                <div align="center">
                                    <button class="btn">SUBMIT</button>
                                </div>
                                <br>
                                <!--<tr>-->
                                    <!--<td>Enter Password</td>-->
                                    <!--<td><input type="password" name="password" size="30" minlength="6" maxlength="25" required></td>-->
                                <!--</tr>-->
                                <!--<tr>-->
                                    <!--<td>Confirm Password</td>-->
                                    <!--<td><input type="password" id="confirmPassword" size="30" minlength="6" maxlength="25" required></td>-->
                                <!--</tr>-->
                                <!--<tr>-->
                                    <!--<td colspan="2"><input type="submit" id='submitBtn' value="Send"></td>-->
                                <!--</tr>-->
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </td>
    </tr>
</table>
</body>
</html>`;

var setPasswordSuccess = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">
 
    <title>Set Password</title>
    <style>
        @media(max-width: 991px){
            table{width: 100%!important; max-width: 350px!important;}
            .styl-yes{font-size: 20px!important; line-height: 22px!important;}
 
 
        }
 
 
    </style>
 
    <style type="text/css">
 
        /*@media(min-width: 768px){
           table{max-width: 600px!important}
 
        .smal-pad{padding:0px 35px!important;}
        */
        /*button {*/
            /*height : 30px;*/
            /*width : 100px;*/
            /*border-radius: 20px;*/
            /*background-color : #0096FF;*/
            /*font-size: 10px;*/
            /*color : #ffffff;*/
            /*font-family:system-ui;*/
        /*}*/
        .btn {
            border: 0;
            font-size: 0.9rem;
            height: 2.5rem;
            line-height: 2.5rem;
            padding: 0 1.5rem;
            text-transform: uppercase;
            border-radius: .25rem;
            letter-spacing: .2em;
            transition: background .2s;
            width : 100%;
            background-color : #6380e0;
            color : #ffffff;
            font-family: sans-serif;
        }
        .btn:focus {
            outline: 0;
        }
        .btn:hover,
        .btn:focus {
            background: #6380e0 ;
            opacity: 0.7;
        }
        table{max-width:600px; width:100%; }
 
 
        @media (max-width: 786px){
 
            table{max-width:350px; width:100%; }
            .smal-pad{padding:0px 15px!important;}
            .font-small{font-size: 18px!important}
 
        }
    </style>
 
</head>
<body >
<table style="text-align:left; border:none; margin:auto; padding-top:10px; background-color:#fff; border-spacing: 0px; " border="0" cellpadding="0" cellspacing="0">
    <tr>
        <td>
            <p style="margin: 0px"><img src="https://fuguchat.s3.ap-south-1.amazonaws.com/default/7zwNFgy312_1518070410530.png" width="150"/></p>
        </td>
    </tr>
    <tr>
        <td style="text-align:center;">
            <div class="smal-pad" style="width: 100%;
                        display: inline-block;
                        text-align: left;
                                 padding: 0px 35px;
                        background-color: #fff;
                        margin-top: 20px;
                        margin-bottom: 0px;
                        border: 1px solid #dde5ed;
                        box-sizing: border-box; ">
                <div style="width: 100%;
                           display: table;
                           border-bottom: 1px solid #ccc;
                           box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 20px;
                         font-family: 'Montserrat', sans-serif;
                         font-weight: 600;
                         line-height: 28px;
                         padding: 20px 25px;
                          margin: 0px;
                         color:#637280; " class="styl-yes">
                            You have successfully signup on Fugu Chat. Please login using App</p>
                    </div>
                </div>
                <div style="width: 100%;
                           display: table;
                           box-sizing: border-box;padding: 20px 0px;">
                    <table>
                        <tr>
                            <td style="width:200px"><a href="http://hyperurl.co/officechat"><button class="btn">Android</button></a></td>
                            <td style="width:200px"><a href="http://hyperurl.co/officechat_ios"><button class="btn" >IOS</button></a></td>
                        </tr>
                    </table>
                </div>
 
            </div>
        </td>
    </tr>
</table>
</body>
</html>`;

var resetPasswordSuccess = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
        <title>{{{app_name}}}</title>
        <style type="text/css">
            body {
                background-color:whitesmoke;
            }

            a:hover {
                opacity: 0.7 !important;
            }

            table{max-width:500px; width:100%; }

            *{
                font-family: Lato, Helvetica, Arial, sans-serif !important       
            }


            @media (max-width: 786px){
                table{max-width:350px; width:100%; }
                .smal-pad{padding:0px 15px!important;}
                .font-small{font-size: 18px!important}
            }
        </style>
    </head>
    <body>
        <table style="text-align:left; border:none; margin:auto; background-color:#fff; border-spacing: 0px; " border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <p style="margin: 0px;text-align:center;padding:10px;background-color:#F9F9F9">
                        <img src={{{logo}}}>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="text-align:center;">
                        <div class="smal-pad" style="width: 100%;
                              display: inline-block;
                              text-align: left;
                              padding: 0px 35px;
                              background-color: #fff;
                              margin-bottom: 0px;
                              box-sizing: border-box;
                              text-align:center ;">

                            <div style="width: 100%;
                                 display: table;
                                 box-sizing: border-box;">
                                <div style="display: table-cell; vertical-align: middle;">
                                    <p class="font-small" style="font-size: 24px;
                                       font-family: 'Montserrat', sans-serif;
                                       font-weight: 600;
                                       line-height: 32px;
                                        padding: 20px 0px;
                                        margin: 0px;
                                        text-align:left;" class="styl-yes">
                                        You have successfully changed your password.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
        </table>
    </body>
</html>`;

var userResetPassword = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
        <title>{{{app_name}}}</title>
        <style type="text/css">
            body {
                background-color:whitesmoke;
            }

            a:hover {
                opacity: 0.7 !important;
            }

            table{max-width:500px; width:100%; }

            *{
                font-family: Lato, Helvetica, Arial, sans-serif !important       
            }


            @media (max-width: 786px){
                table{max-width:350px; width:100%; }
                .smal-pad{padding:0px 15px!important;}
                .font-small{font-size: 18px!important}
            }
            
            .field {
            position: relative;
            margin-bottom: 2em;
            }
        .input {
            width: 100%;
            font-size: 100%;
            border: 0;
            padding: 0;
            background-color: transparent;
            height: 2rem;
            line-height: 2rem;
            border-bottom: 1px solid #eee;
            color: #777;
            transition: all .2s ease-in;
        }
        .input:focus {
            outline: 0;
            border-color: #ccc;
        }
 
        /* Using required and a faux pattern to see if input has text from http://stackoverflow.com/questions/16952526/detect-if-an-input-has-text-in-it-using-css */
        .input:focus + .label,
        input:valid + .label {
            transform: translateY(-100%);
            font-size: 0.75rem;
            color: #0096FF;
        }
            button:focus {
                outline: none;
            }
        </style>
         <script>
           var validation = function(){
                var password = document.getElementById('fieldUser').value.trim();
                var confirmPassword = document.getElementById('fieldPassword').value.trim();
               if(password == '' || confirmPassword == '') {
                   alert("Password can not be empty");
                    return false;
               }
                if(password != confirmPassword){
                    alert("New password and confirm password do not match");
                    return false;
                }
                return true;
            }
        </script>
    </head>
    <body>
        <table style="text-align:left; border:none; margin:auto; background-color:#fff; border-spacing: 0px; " border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <p style="margin: 0px;text-align:center;padding:10px;background-color:#F9F9F9">
                        <img src={{{logo}}}>
                    </p>
                </td>
            </tr>
            <tr>
                <td style="text-align:center;">
                        <div class="smal-pad" style="width: 100%;
                              display: inline-block;
                              text-align: left;
                              padding: 0px 35px;
                              background-color: #fff;
                              margin-bottom: 0px;
                              box-sizing: border-box;
                              text-align:center ;">

                            <div style="width: 100%;
                                 display: table;
                                 box-sizing: border-box;">
                                <div style="display: table-cell; vertical-align: middle;">
                                    <p class="font-small styl-yes" style="font-size: 24px;
                                       font-family: 'Montserrat', sans-serif;
                                       font-weight: 600;
                                       line-height: 32px;
                                        padding: 20px 0px;
                                        margin: 0px;
                                        text-align:left;">
                                        Enter your new password for {{{app_name}}}.
                                    </p>
                                </div>
                            </div>
                            <div style="width: 100%;
                                 display: table;
                                 box-sizing: border-box;">
                                <div style="display: table-cell; vertical-align: middle;">
                                    <form action="{{{url}}}" method="post" onsubmit="return validation()">
                                            <input type="hidden" name="reset_password_token" value="{{{reset_password_token}}}" size="30" maxlength="25">
                                            <input type="hidden" name="domain" value="{{{domain}}}">
                                            <input type="hidden" name="workspace" value="{{{workspace}}}">
                                        <div>
                                            <div class="field">
                                                <input type="password" placeholder="Enter Password" id="fieldUser" name="password" class="input" minlength="6" maxlength="25" required />
                                            </div>
                                            <div class="field">
                                                <input type="password" placeholder="Confirm Password" id="fieldPassword" class="input" minlength="6" maxlength="25" required/>
                                            </div>
                                        </div>
                                        <div align="center">
                                            <button style="background-color: #6380E0;
                                                padding: 15px 20px;color: #fff;margin-bottom: 10px;display: inline-block;font-family: 'Lato', sans-serif;cursor: pointer;
                                                text-decoration: none!important;border-radius: 10px;">
                                                Change my password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
        </table>
    </body>
</html>`;

exports.userSetPassword = userSetPassword;
exports.userResetPassword = userResetPassword;
exports.setPasswordSuccess = setPasswordSuccess;
exports.resetPasswordSuccess = resetPasswordSuccess;
