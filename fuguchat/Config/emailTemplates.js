var requestEmail = `

<!DOCTYPE html>
<html>

<head>
    <title>Midnight Chef :: Email Template</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style type="text/css">
        /* CLIENT-SPECIFIC STYLES */

        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        /* Prevent WebKit and Windows mobile changing default text sizes */

        table,
        td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        /* Remove spacing between tables in Outlook 2007 and up */

        img {
            -ms-interpolation-mode: bicubic;
        }
        /* Allow smoother rendering of resized image in Internet Explorer */
        /* RESET STYLES */

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }
        /* iOS BLUE LINKS */

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
        /* MOBILE STYLES */

        @media screen and (max-width: 525px) {
            /* ALLOWS FOR FLUID TABLES */
            .wrapper {
                width: 100% !important;
                max-width: 100% !important;
            }
            /* ADJUSTS LAYOUT OF LOGO IMAGE */
            .logo img {
                margin: 0 auto !important;
            }
            /* USE THESE CLASSES TO HIDE CONTENT ON MOBILE */
            .mobile-hide {
                display: none !important;
            }
            .img-max {
                max-width: 100% !important;
                width: 100% !important;
                height: auto !important;
            }
            /* FULL-WIDTH TABLES */
            .responsive-table {
                width: 100% !important;
            }
            /* UTILITY CLASSES FOR ADJUSTING PADDING ON MOBILE */
            .padding {
                padding: 10px 5% 15px 5% !important;
            }
            .padding-meta {
                padding: 30px 5% 0px 5% !important;
                text-align: center;
            }
            .padding-copy {
                padding: 10px 5% 10px 5% !important;
                text-align: center;
            }
            .no-padding {
                padding: 0 !important;
            }
            .section-padding {
                padding: 50px 15px 50px 15px !important;
            }
            /* ADJUST BUTTONS ON MOBILE */
            .mobile-button-container {
                margin: 0 auto;
                width: 100% !important;
            }
            .mobile-button {
                padding: 15px !important;
                border: 0 !important;
                font-size: 16px !important;
                display: block !important;
            }
        }
        /* ANDROID CENTER FIX */

        div[style*="margin: 16px 0;"] {
            margin: 0 !important;
        }
    </style>
</head>

<body style="margin: 0 !important; padding: 0 !important;">

    <!-- HEADER -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">

        <tr>
            <td bgcolor="#ffffff" align="center" style="padding:15px 15px 0;">
                <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="500">
            <tr>
            <td align="center" valign="top" width="500">
            <![endif]-->
                <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
            </td>
        </tr>
        <tr>
            <td bgcolor="#ffffff" align="center" style="padding:0 15px 0;" class="padding">
                <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="800">
            <tr>
            <td align="center" valign="top" width="800">
            <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px; background:#f5f8fa" class="responsive-table">
                    <tr>
                        <td style="padding:20px 40px 0; background:#fff;">
                            <!-- TWO COLUMNS -->
                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 18px;">Hi <span style="font-weight:bold;">{{{full_name}}}</span></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 16px; padding-top:10px;">A new lead has requested for fuguChat services.</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->

                                    </td>
                                </tr>
                                <tr>
                                <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">Email : {{{email}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{name}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{contact_no}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{additional_info}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
            </td>
        </tr>
    </table>

</body>

</html>
`;

var businessSignup = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
 
    <title>Fugu Chat</title>
    <!--<style>
       @media(max-width: 991px){
       table{width: 100%!important; max-width: 350px!important;}
       .styl-yes{font-size: 20px!important; line-height: 22px!important;}
 
 
       }
 
 
    </style>-->
 
    <style type="text/css">
 
        /*@media(min-width: 768px){
           table{max-width: 600px!important}
 
        .smal-pad{padding:0px 35px!important;}
        */
        body{
            background-color:whitesmoke;
        }
        a:hover {
            opacity: 0.7 !important;
        }
 
        table{max-width:500px; width:100%; }
 
 
        @media (max-width: 786px){
 
            table{max-width:350px; width:100%; }
            .smal-pad{padding:0px 15px!important;}
            .font-small{font-size: 18px!important}
 
        }
        *{
            font-family: Lato, Helvetica, Arial, sans-serif !important
        }
    </style>
 
</head>
<body >
<table style="text-align:left; border:none; margin:auto; background-color:#fff;  border-spacing: 0px; "   border="0" cellpadding="0" cellspacing="0">
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
                        <p class="font-small" style="font-size: 28px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 600;
                           line-height: 32px;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:left;
                           " class="styl-yes">Confirm your email with the following code.</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 28px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 500;
                           line-height: 32px;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:center;
                           " class="styl-yes">{{{otp}}}</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 20px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 300;
                           line-height: 32px;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:left;" class="styl-yes">Thank you for signing up on {{app_name}}. We're happy you're here.</p>
                    </div>
                </div>
            </div>
        </td>
    </tr>
</table>
</body>
</html>
`;


var userInvitation = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
 
    <title>Fugu Chat</title>
    <!--<style>
       @media(max-width: 991px){
       table{width: 100%!important; max-width: 350px!important;}
       .styl-yes{font-size: 20px!important; line-height: 22px!important;}
 
 
       }
 
 
    </style>-->
 
    <style type="text/css">
 
        /*@media(min-width: 768px){
           table{max-width: 600px!important}
 
        .smal-pad{padding:0px 35px!important;}
        */
        body{
            background-color:whitesmoke;
        }
        a:hover {
            opacity: 0.7 !important;
        }
 
        table{max-width:500px; width:100%; }
 
 
        @media (max-width: 786px){
 
            table{max-width:350px; width:100%; }
            .smal-pad{padding:0px 15px!important;}
            .font-small{font-size: 18px!important}
 
        }
        *{
            font-family: Lato, Helvetica, Arial, sans-serif !important
        }
    </style>
 
</head>
<body >
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
                        <p class="font-small" style="font-size: 28px;
                           font-family: 'Montserrat', sans-serif;
                           line-height: 32px;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:center;
                           " class="styl-yes">{{{full_name}}} has invited you to <b>{{{workspace_name}}}</b><br/> on {{{app_name}}}.</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 16px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 500;
                           line-height: 24px;
                            padding: 10px 0px;
                            margin: 0px;
                            text-align:left; pointer-events:none;
                           " class="styl-yes">
                           {{{app_name}}} is an all-purpose chat app that enables communication, engagement and interaction through a single platform. 
                           {{{app_name}}}  helps in an effortless exchange of ideas and thoughts, one can hold meetings and even monitor attendance in an efficient manner. 
                             It is accessible across all platforms- mobile and web-based networks which streamlines information sharing and collaboration.
                        </p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 15px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 500;
                            padding-top: 20px;
                            padding-bottom: 2px;
                            margin: 0px;
                            text-align:center; pointer-events:none;
                           " class="styl-yes">
                           Try it out for yourself now!
                        </p>
                    </div>
                </div>
                <div style="padding:0px 0px">
                    <p style="text-align: center"><a href={{{invitation_link}}} style="background-color: #6FC37B;
                        padding: 15px 30px;
                        color: #fff;
                        margin-bottom: 10px;
                        display: inline-block;
                        font-family: 'Lato', sans-serif;
                        text-decoration: none!important;
                        border-radius: 10px; font-size: 20px;">Click here to Join</a></p>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 14px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 300;
                            margin: 0px;
                            color:gray;
                            text-align:left;" class="styl-yes">Have a great day!</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 16px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 300;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:left;" class="styl-yes">Cheers,<br/>
                            {{{app_name}}}</p>
                    </div>
                </div>
            </div>
        </td>
    </tr>
</table>
</body>
</html>
`;

var resetPassword = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
        <title>Fugu Chat</title>
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
                                        text-align:left;
                                       " class="styl-yes">Hey {{{full_name}}},</p>
                                </div>
                            </div>
                            <div style="width: 100%;
                                 display: table;
                                 box-sizing: border-box;">
                                <div style="display: table-cell; vertical-align: middle;">
                                    <p class="font-small" style="font-size: 18px;
                                       font-family: 'Montserrat', sans-serif;
                                       font-weight: 400;
                                       line-height: 28px;
                                        padding: 0px 0px;
                                        margin: 0px;
                                        text-align:left;" class="styl-yes">
                                        We've recieved a request to reset your password. If you didn't make the request, just ignore this email. Otherwise, you can reset your password using this link:
                                    </p>
                                </div>
                            </div>
                            <div style="width: 100%;
                                 display: table;
                                 box-sizing: border-box;">
                                <div style="display: table-cell; vertical-align: middle;">
                                    
                                    <p style="text-align: center"><a href={{{reset_password_link}}} style="background-color: #6380E0;
                                        padding: 15px 20px;color: #fff;margin-bottom: 10px;display: inline-block;font-family: 'Lato', sans-serif;
                                        text-decoration: none!important;border-radius: 10px;"> 
                                        Choose a new password</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
        </table>
    </body>
</html>`;


var welcomeEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>fuguChat Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
                <p class="same-font-text">Hi {{{full_name}}}</p>
                <p class="same-font-text">Thanks for signing up! We are really excited to add value to your existing business operations.</p>
                <p class="same-font-text">fuguChat shows you who your customers are and makes it and easy to communicate with them - personally - at scale - on your website, inside web and mobile apps. You will soon realize that it’s super easy to get started with, can fit the demands of your most complicated workflows and can integrate with any other technology piece you might be currently using.</p>
                <p class="same-font-text">If you don’t mind, we would love if you answer one quick question:</p>
                <p class="same-font-text"><b>Why did you sign up for fuguChat?</b></p>
                <p class="same-font-text">Knowing what made you sign up is super useful in ensuring that we are delivering on what you want. Just hit “Reply” and let us know.</p>
                <p class="same-font-text">We look forward to hearing from you and getting your fuguChat configuration up and running at the earliest.</p>
                <p class="same-font-text"><b>Regards</b></p>
                <p class="same-font-text"><b>Team fuguChat</b></p>
            </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;

var sendDomainsToEmail = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
       <meta name="viewport" content="width=device-width, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">

      <title>Fugu Chat Signup</title>
      <!--<style>
         @media(max-width: 991px){
         table{width: 100%!important; max-width: 350px!important;} 
         .styl-yes{font-size: 20px!important; line-height: 22px!important;}


         } 

             
      </style>-->

<style type="text/css">

/*@media(min-width: 768px){
   table{max-width: 600px!important}

.smal-pad{padding:0px 35px!important;}
*/

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
                                         box-sizing: border-box;">
                     <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 28px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 600;
                           line-height: 28px;
                               padding: 20px 0px;margin: 0px; " class="styl-yes"> Your Workspaces</p>
                     </div>
                  </div>
                  <div style="padding:0px 0px">
                     <p style="font-size:17px; font-family: 'Lato', sans-serif; 
                     color:#637280; font-weight:400; line-height: 28px; margin-top: 5px; margin-bottom: 10px; ">
                     You're already a member of these workspaces:</p>
                     <div class="container" style="width:80%; padding: 15px 0px;">
                        <table class="card" style="border: 1px solid #dde5ed; border-radius: 4px; padding: 8px;">
                            {{{html}}}
                        </div>
                     </div>
                  </div>
               </div>
            </td>
         </tr>
      </table>
   </body>
</html>`;

var feedbackMail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>fuguChat Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
                <p class="same-font-text">Name : {{{full_name}}}</p>
                <p class="same-font-text">Email : {{{email}}}</p>
                <p class="same-font-text">Feedback : {{{feedback}}}</p>
                <p class="same-font-text">Details : {{{extra_details}}}</p>
                </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;

let gdprQueryMail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>fuguChat Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
                <p class="same-font-text">Name : {{{full_name}}}</p>
                <p class="same-font-text">Email : {{{email}}}</p>
                <p class="same-font-text">Query : {{{query}}}</p>
                <p class="same-font-text">Reason : {{{reason}}}</p>
                <p class="same-font-text">Workspace Id : {{{workspace_id}}}</p>
                <p class="same-font-text">Workspace Name : {{{workspace_name}}}</p>
                </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;


let signUp = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
 
    <title>Fugu Chat</title>
    <!--<style>
       @media(max-width: 991px){
       table{width: 100%!important; max-width: 350px!important;}
       .styl-yes{font-size: 20px!important; line-height: 22px!important;}
 
 
       }
 
 
    </style>-->
 
    <style type="text/css">
 
        /*@media(min-width: 768px){
           table{max-width: 600px!important}
 
        .smal-pad{padding:0px 35px!important;}
        */
        body{
            background-color:whitesmoke;
        }
        a:hover {
            opacity: 0.7 !important;
        }
 
        table{max-width:500px; width:100%; }
 
 
        @media (max-width: 786px){
 
            table{max-width:350px; width:100%; }
            .smal-pad{padding:0px 15px!important;}
            .font-small{font-size: 18px!important}
 
        }
        *{
            font-family: Lato, Helvetica, Arial, sans-serif !important
        }
    </style>
 
</head>
<body >
<table style="text-align:left; border:none; margin:auto; background-color:#fff; border-spacing: 0px; " border="0" cellpadding="0" cellspacing="0">
    <tr>
        <td>
            <p style="margin: 0px;text-align:center;padding:10px;background-color:#F9F9F9">
                 <img src='https://fuguchat.s3.ap-south-1.amazonaws.com/image/qbaCXkzZJh.1554726061968.png'>
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
                        <p class="font-small" style="font-size: 28px;
                           font-family: 'Montserrat', sans-serif;
                           line-height: 32px;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:center;
                           " class="styl-yes">Invitation from {{{app_name}}}.</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 16px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 500;
                           line-height: 24px;
                            padding: 10px 0px;
                            margin: 0px;
                            text-align:left; pointer-events:none;
                           " class="styl-yes">
                           {{{app_name}}} is a platform that helps simplify communication for more efficient teamwork.
                        It helps to create alignment and shared understanding across your team.You can also use it
                         to stay connected to your friends & family, your open networks and ofcourse, your internal team.
                        </p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 15px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 500;
                            padding-top: 20px;
                            padding-bottom: 2px;
                            margin: 0px;
                            text-align:center; pointer-events:none;
                           " class="styl-yes">
                           TRY IT OUT FOR YOURSELF NOW
                        </p>
                    </div>
                </div>
                <div style="padding:0px 0px">
                    <p style="text-align: center"><a href={{{workspace_url}}} style="background-color: #2296ff;
                        padding: 15px 30px;
                        color: #fff;
                        margin-bottom: 10px;
                        display: inline-block;
                        font-family: 'Lato', sans-serif;
                        text-decoration: none!important;
                        border-radius: 10px; font-size: 20px;">Click here to Join</a></p>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 14px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 300;
                            margin: 0px;
                            color:gray;
                            text-align:left;" class="styl-yes">Have a great day!</p>
                    </div>
                </div>
                <div style="width: 100%;
                     display: table;
                     box-sizing: border-box;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p class="font-small" style="font-size: 16px;
                           font-family: 'Montserrat', sans-serif;
                           font-weight: 300;
                            padding: 20px 0px;
                            margin: 0px;
                            text-align:left;" class="styl-yes">Cheers,<br/>
                            Fugu</p>
                    </div>
                </div>
            </div>
        </td>
    </tr>
</table>
</body>
</html>
`;


let newContactNumber = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>fuguChat Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
                <p class="same-font-text"> New User Trying to Register :{{{contact_number}}} </p>
                </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;

var requestEmail = `

<!DOCTYPE html>
<html>

<head>
    <title>Midnight Chef :: Email Template</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style type="text/css">
        /* CLIENT-SPECIFIC STYLES */

        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        /* Prevent WebKit and Windows mobile changing default text sizes */

        table,
        td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        /* Remove spacing between tables in Outlook 2007 and up */

        img {
            -ms-interpolation-mode: bicubic;
        }
        /* Allow smoother rendering of resized image in Internet Explorer */
        /* RESET STYLES */

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }
        /* iOS BLUE LINKS */

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
        /* MOBILE STYLES */

        @media screen and (max-width: 525px) {
            /* ALLOWS FOR FLUID TABLES */
            .wrapper {
                width: 100% !important;
                max-width: 100% !important;
            }
            /* ADJUSTS LAYOUT OF LOGO IMAGE */
            .logo img {
                margin: 0 auto !important;
            }
            /* USE THESE CLASSES TO HIDE CONTENT ON MOBILE */
            .mobile-hide {
                display: none !important;
            }
            .img-max {
                max-width: 100% !important;
                width: 100% !important;
                height: auto !important;
            }
            /* FULL-WIDTH TABLES */
            .responsive-table {
                width: 100% !important;
            }
            /* UTILITY CLASSES FOR ADJUSTING PADDING ON MOBILE */
            .padding {
                padding: 10px 5% 15px 5% !important;
            }
            .padding-meta {
                padding: 30px 5% 0px 5% !important;
                text-align: center;
            }
            .padding-copy {
                padding: 10px 5% 10px 5% !important;
                text-align: center;
            }
            .no-padding {
                padding: 0 !important;
            }
            .section-padding {
                padding: 50px 15px 50px 15px !important;
            }
            /* ADJUST BUTTONS ON MOBILE */
            .mobile-button-container {
                margin: 0 auto;
                width: 100% !important;
            }
            .mobile-button {
                padding: 15px !important;
                border: 0 !important;
                font-size: 16px !important;
                display: block !important;
            }
        }
        /* ANDROID CENTER FIX */

        div[style*="margin: 16px 0;"] {
            margin: 0 !important;
        }
    </style>
</head>

<body style="margin: 0 !important; padding: 0 !important;">

    <!-- HEADER -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">

        <tr>
            <td bgcolor="#ffffff" align="center" style="padding:15px 15px 0;">
                <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="500">
            <tr>
            <td align="center" valign="top" width="500">
            <![endif]-->
                <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
            </td>
        </tr>
        <tr>
            <td bgcolor="#ffffff" align="center" style="padding:0 15px 0;" class="padding">
                <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="800">
            <tr>
            <td align="center" valign="top" width="800">
            <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px; background:#f5f8fa" class="responsive-table">
                    <tr>
                        <td style="padding:20px 40px 0; background:#fff;">
                            <!-- TWO COLUMNS -->
                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 18px;">Hi <span style="font-weight:bold;">{{{full_name}}}</span></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 16px; padding-top:10px;">A new lead has requested for Fugu services.</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->

                                    </td>
                                </tr>
                                <tr>
                                <td valign="top" class="mobile-wrapper">
                                        <!-- LEFT COLUMN -->
                                        <table cellpadding="0" cellspacing="0" border="0" align="left">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">Email : {{{email}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{name}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{contact_no}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="left" style="font-family: Arial, sans-serif; color: #333333; font-size: 17px;">{{{additional_info}}}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- RIGHT COLUMN -->
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
            </td>
        </tr>
    </table>

</body>

</html>
`;

var resellerSignup = `

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
       <meta name="viewport" content="width=device-width, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">

      <title>Fugu Newsletter</title>
      <!--<style>
         @media(max-width: 991px){
         table{width: 100%!important; max-width: 350px!important;} 
         .styl-yes{font-size: 20px!important; line-height: 22px!important;}


         } 

             
      </style>-->

<style type="text/css">

/*@media(min-width: 768px){
   table{max-width: 600px!important}

.smal-pad{padding:0px 35px!important;}
*/

table{max-width:600px; width:100%; }


@media (max-width: 786px){

table{max-width:350px; width:100%; }
.smal-pad{padding:0px 15px!important;}
.font-small{font-size: 18px!important}

}
}
</style>

   </head>
   <body >
      <table style="text-align:left; border:none; margin:auto; padding-top:10px; background-color:#fff;  border-spacing: 0px; "   border="0" cellpadding="0" cellspacing="0">
         <tr>
            <td>
               <p style="margin: 0px"><img src="https://tookan.staging.wpengine.com/wp-content/uploads/2017/07/logo@3x.png" width="150"/></p>
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
                               padding: 20px 0px;
    margin: 0px;

                           color:#637280; " class="styl-yes"> Congrats !! You have enabled fugu.</p>
                     </div>
                  </div>
                  <div style="padding:0px 0px">
                     <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 10px; "> Fugu shows you who your customers are and makes it easy to communicate with them, personally, at scale — on your website, inside web and mobile apps, and by email.</p>
                     <p style="font-size:17px; font-family: 'Montserrat', sans-serif; color:#637280;  font-weight:600; line-height: 28px; margin: 0px">What you can do with Fugu:</p>
                     <ul style="padding-left: 30px;
                        list-style-type: circle; margin-top: 10px">
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">Capture Website visitor location
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">
                           View referral link of website visitor
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;   font-weight:300; line-height: 28px;">
                           Capture time spent on your website
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">
                           Notification on new message sent to the visitor
                        </li>
                     </ul>
                     <p><a href={{{invitation_link}}} style="background-color: #5772df;
                        padding: 15px 20px;
                        color: #fff;
                        margin-bottom: 10px;
                        display: inline-block;
                        font-family: 'Lato', sans-serif;
                        text-decoration: none!important;
                        border-radius: 10px;"> Try it Out !!</a></p>
                  </div>
               </div>
            </td>
         </tr>
      </table>
   </body>
</html>
`;


var agentInvitation = `

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
       <meta name="viewport" content="width=device-width, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">

      <title>Fugu Newsletter</title>
      <!--<style>
         @media(max-width: 991px){
         table{width: 100%!important; max-width: 350px!important;} 
         .styl-yes{font-size: 20px!important; line-height: 22px!important;}


         } 

             
      </style>-->

<style type="text/css">

/*@media(min-width: 768px){
   table{max-width: 600px!important}

.smal-pad{padding:0px 35px!important;}
*/

table{max-width:600px; width:100%; }


@media (max-width: 786px){

table{max-width:350px; width:100%; }
.smal-pad{padding:0px 15px!important;}
.font-small{font-size: 18px!important}

}
}
</style>

   </head>
   <body >
      <table style="text-align:left; border:none; margin:auto; padding-top:10px; background-color:#fff;  border-spacing: 0px; "   border="0" cellpadding="0" cellspacing="0">
         <tr>
            <td>
               <p style="margin: 0px"><img src="https://web.fuguchat.com/assets/images/fugudesk.png" width="150"/></p>
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
                               padding: 20px 0px;
    margin: 0px;

                           color:#637280; " class="styl-yes">You have been invited to join the {{{business_name}}} team on Hippo.</p>
                     </div>
                  </div>
                  <div style="padding:0px 0px">
                     <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 10px; "> Hippo shows you who your customers are and makes it easy to communicate with them, personally, at scale — on your website, inside web and mobile apps, and by email.</p>
                     <p style="font-size:17px; font-family: 'Montserrat', sans-serif; color:#637280;  font-weight:600; line-height: 28px; margin: 0px">What you can do with Hippo:</p>
                     <ul style="padding-left: 30px;
                        list-style-type: circle; margin-top: 10px">
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">Capture Website visitor location
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">
                           View referral link of website visitor
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;   font-weight:300; line-height: 28px;">
                           Track new leads
                        </li>
                        <li style="color: #637280; font-size:17px; font-family: 'Lato', sans-serif;  font-weight:300; line-height: 28px;">
                           Notification on new message sent to the visitor
                        </li>
                     </ul>
                     <p><a href={{{invitation_link}}} style="background-color: #5772df;
                        padding: 15px 20px;
                        color: #fff;
                        margin-bottom: 10px;
                        display: inline-block;
                        font-family: 'Lato', sans-serif;
                        text-decoration: none!important;
                        border-radius: 10px;"> Join your team</a></p>
                  </div>
               </div>
            </td>
         </tr>
      </table>
   </body>
</html>
`;

var resetPassword =
    `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
       <meta name="viewport" content="width=device-width, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css?family=Lato:400,700" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700" rel="stylesheet">

      <title>Hippo Newsletter</title>
      <!--<style>
         @media(max-width: 991px){
         table{width: 100%!important; max-width: 350px!important;} 
         .styl-yes{font-size: 20px!important; line-height: 22px!important;}


         } 

             
      </style>-->

<style type="text/css">

/*@media(min-width: 768px){
   table{max-width: 600px!important}

.smal-pad{padding:0px 35px!important;}
*/

table{max-width:600px; width:100%; }


@media (max-width: 786px){

table{max-width:350px; width:100%; }
.smal-pad{padding:0px 15px!important;}
.font-small{font-size: 18px!important}

}
}

</style>

   </head>
   <body >
      <table style="text-align:left; border:none; margin:auto; padding-top:10px; background-color:#fff;  border-spacing: 0px; "   border="0" cellpadding="0" cellspacing="0">
         <tr>
            <td>
               <p style="margin: 0px"><img src={{{logo}}} width="150"/></p>
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
                 
                  <div style="padding:0px 0px">
                     <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:700; line-height: 28px; margin-top: 15px; margin-bottom: 10px; "> Hello {{{email}}}!</p>



                     <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 10px; ">We have received a request to reset your {{{app_name}}} password.</p>
                     <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 10px; ">Click the link below to change your password.</p>
                 
                    
                    <p><a href={{{reset_password_link}}} style="background-color: #5772df;
                        padding: 15px 20px;
                        color: #fff;
                        margin-bottom: 0px;
                        display: inline-block;
                        font-family: 'Lato', sans-serif;
                        text-decoration: none!important;
                        border-radius: 10px;">Change my password</a></p>







 <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 10px; ">Didn't request this change?</p>




  <p style="font-size:17px; font-family: 'Lato', sans-serif; color:#637280;  font-weight:400; line-height: 28px; margin-top: 15px; margin-bottom: 15px; ">If you didn't request a new password, Please ignore.</p>

                 
                     
                  </div>
               </div>
            </td>
         </tr>
      </table>
   </body>
</html>   
 `;


var welcomeEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Hippo Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
               <p class="same-font-text">Hi {{{owner_name}}}</p>
                <p class="same-font-text">Thanks for signing up on Hippo. Hippo Live Chat helps you have "Happy Customers".</p>
                <p class="same-font-text">Here are the two simple steps of adding Hippo Live Chat to interact with customers: </p>
                <p class="same-font-text">1. Install the Web SDK on your website. <a href="https://hippodesk.co/#/settings/businessSettings/installation/web">Click here</a></p>
                <p class="same-font-text">2. Install the Mobile SDKs in your applications. <a href="https://hippodesk.co/#/settings/businessSettings/installation/android/sdk">Click here</a></p>
                <p class="same-font-text">You will soon realize that it’s super easy to get started with, can fit the demands of your most complicated workflows and can integrate with any other technology piece you might be currently using.</p>
                <p class="same-font-text">We look forward to hearing from you and getting your Hippo configuration up and running at the earliest.</p>
                <p class="same-font-text"><b>Regards,</b></p>
                <p class="same-font-text"><b>Team Hippo</b></p>
            </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;

var messageEmail = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

    <title>Fugu Chat</title>
    <style>
        .image {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: inline-block;
            vertical-align: top;
            object-fit: cover;
        }

        .fugu-image {
            width: 44px;
            height: 44px;
            display: inline-block;
            vertical-align: top;
            object-fit: cover;
        }

        .button {
            background-color: #4CAF50;
            border: none;
            padding: 15px 26px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer !important;
            text-decoration: none;
            color: white !important;
        }
        .character {
            position: absolute;
            left: 18px;
            top: 9px;
            color: white;
            font-size: 37px;
            margin: 18px;
        }

        .text {
            color: #b21118;
        }

        .heading-div {
            display: table-cell;
            font-size: 16px !important;
            /* width: 84%; */
        }

        .table-container {
            display: -webkit-box;
            width: 85%;
        }

        .table-child {
            display: table-cell;
            padding-right: 10px;
        }

    </style>

</head>

<body>
    <div class="table-container">
        {{{user_image_html}}}
        <div>
            <div class="heading-div">
                <div class="text">{{{user_name}}} sent you this message on {{{business_name}}}</div>
            </div>
            <div class="message-container">
                {{{custom_label}}}
                <p style="font-size: 14px">{{{message}}}</p>
                <a href={{{channel_url}}} class="button" style="margin-top:45px;margin-right: 8px;">View message on {{{app_name}}}</a>
            </div>
        </div>
    </div>
</body>
</html> `;


var leaveEmail = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>fuguChat Email</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<style>
    .email-box-fugu{
       padding:20px;
    }
</style>
<body>
    <div class="list-section">
        <div class="container">
            <div class="row email-box-fugu">
            <p class="same-font-text">{{{title}}}</p>
                <p class="same-font-text">Email : {{{email}}}</p>
  {{{comment_start}}} <p class="same-font-text">Employee Id : {{{employee_id}}}</p> {{{comment_end}}}
  {{{approved_by_comment_start}}}     <p class="same-font-text">Approved by : {{{approved_by}}}</p> {{{approved_by_comment_end}}}
                </div>
        </div>
    </div>
    <div class="clearfix"></div>
</body>
</html>`;


var signupEmail = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml"> 
<head> 
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> 
<meta 
name="viewport" 
content="width=device-width, initial-scale=1, maximum-scale=1" 
/> 
<link 
href="https://fonts.googleapis.com/css?family=Lato:400,700" 
rel="stylesheet" 
/> 

<title>Fugu Chat</title> 
<!--<style> 
@media(max-width: 991px){ 
table{width: 100%!important; max-width: 350px!important;} 
.styl-yes{font-size: 20px!important; line-height: 22px!important;} 


} 


</style>--> 

<style type="text/css"> 
/*@media(min-width: 768px){ 
table{max-width: 600px!important} 

.smal-pad{padding:0px 35px!important;} 
*/ 
body { 
background-color: whitesmoke; 
} 
a:hover { 
opacity: 0.7 !important; 
} 

table { 
max-width: 500px; 
width: 100%; 
text-align: left; 
border: none; 
margin: auto; 
background-color: #e8e8e8; 
border-spacing: 0px; 
padding: 30px 20px 30px 20px; 
} 

@media (max-width: 786px) { 
table { 
max-width: 350px; 
width: 100%; 
} 
.smal-pad { 
padding: 0px 15px !important; 
} 
.font-small { 
font-size: 18px !important; 
} 
} 

* { 
font-family: Lato, Helvetica, Arial, sans-serif !important; 
} 

.img { 
height: 45px; 
width: 124px; 
} 
</style> 
</head> 
<body> 
<table 
style=" 
text-align: left; 
border: none; 
margin: auto; 
border-spacing: 0px; 
" 
border="0" 
cellpadding="0" 
cellspacing="0" 
> 
<tr> 
<td> 
<p 
style=" 
margin: 0px; 
text-align: center; 
background-color: #e8e8e8; 
margin-bottom: 29px; 
" 
> 
<img 
class="img" 
src={{{logo}}}
/> 
</p> 
</td> 
</tr> 
<tr> 
<td style="text-align: center;"> 
<div 
class="smal-pad" 
style=" 
width: 100%; 
display: inline-block; 
text-align: left; 
padding: 0px 35px; 
background-color: #fff; 
margin-bottom: 0px; 
box-sizing: border-box; 
text-align: center; 
" 
> 
<div style="width: 100%; display: table; box-sizing: border-box;"> 
<div style="display: table-cell; vertical-align: middle;"> 
<p 
class="font-small" 
style=" 
font-size: 37px; 
font-family: 'Montserrat', sans-serif; 
line-height: 47px; 
padding: 20px 0px; 
margin: 0px; 
text-align: center; 
" 
class="styl-yes" 
> 
Thank you for choosing {{app_name}}. 
</p> 
</div> 
</div> 
<div style="width: 100%; display: table; box-sizing: border-box;"> 
<div style="display: table-cell; vertical-align: middle;"> 
<p 
class="font-small" 
style=" 
font-size: 16px; 
font-family: 'Montserrat', sans-serif; 
font-weight: 500; 
line-height: 24px; 
padding: 10px 0px; 
margin: 0px; 
text-align: left; 
pointer-events: none; 
" 
class="styl-yes" 
> 
Please confirm your email by clicking on the following button. 
</p> 
</div> 
</div> 
<div style="width: 100%; display: table; box-sizing: border-box;"> 
<div style="display: table-cell; vertical-align: middle;"> 
<p 
class="font-small" 
style=" 
font-size: 15px; 
font-family: 'Montserrat', sans-serif; 
font-weight: 500; 
padding-top: 20px; 
padding-bottom: 2px; 
margin: 0px; 
text-align: center; 
pointer-events: none; 
" 
class="styl-yes" 
></p> 
</div> 
</div> 
<div style="padding: 0px 0px;"> 
<p style="text-align: center;cursor: hand"> 
<a 
href={{link}} 
style=" 
background-color: #6fc37b; 
border: 1px solid #6fc37b; 
border-color: #6fc37b; 
border-radius: 5px; 
border-width: 1px; 
color: #fff; 
display: inline-block; 
font-size: 14px; 
padding: 12px 40px 12px 40px; 
text-align: center; 
text-decoration: none; 
border-style: solid; 
cursor: pointer 
" 
>Click here to Confirm</a 
> 
</p> 
<p style="color: #6fc37b; font-size: 18px;"> 
We're happy you're here! 
</p> 
</div> 
<div style="width: 100%; display: table; box-sizing: border-box;"> 
<div style="display: table-cell; vertical-align: middle;"> 
<p 
style=" 
font-size: 12px; 
font-family: 'Montserrat', sans-serif; 
font-weight: 300; 
margin: 0px; 
color: gray; 
text-align: left; 
" 
class="styl-yes" 
> 
Note: This verification link is only valid for 60 Minutes from 
the time of request 
</p> 
</div> 
</div> 
<div style="width: 100%; display: table; box-sizing: border-box;"> 
<div style="display: table-cell; vertical-align: middle;"> 
<p 
class="font-small" 
style=" 
font-size: 16px; 
font-family: 'Montserrat', sans-serif; 
font-weight: 300; 
padding: 20px 0px; 
margin: 0px; 
text-align: left; 
" 
class="styl-yes" 
></p> 
</div> 
</div> 
</div> 
</td> 
</tr> 
</table> 
</body> 
</html>
`


var scheduleMeetingEmail =`<!DOCTYPE html>
<html lang="en"><head>
    <title>New Scheduled Meeting</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no">
</head>

<body>
    <div>
        <div style="max-width: 540px;margin: auto;">
            <div style="text-align: center;">
                <img src="{{logo}}" tabindex="0" style="max-width: 200px;width: 30%;"><br>
                <img src="https://s3.fugu.chat/default/3YCuC8f2s4.1599133289427.png" style="margin: 10px 0px;width:100%;" tabindex="0">
            </div>
            <div style="padding: 0px 30px;">
                <h2>Hi {{attendeesemails}},</h2>
                <p style="margin-bottom: 25px;">You have a new scheduled meeting({{title}}).</p>
            </div>
            <div style="background-color: #CCCCCC;border-radius: 10px;padding: 2px;margin: 0px 20px;">
                <div style="background-color: #FFFFFF;color: #000000;padding: 15px 20px;border-radius: 9px;">
                    <p style="font-weight: 600;margin: 0px;">
                        Start Time: {{start_datetime}}<br><br>
                        End Time: {{end_datetime}}
                    </p>
                </div>
            </div>
            <p style="padding: 0px 30px;color:black;">Please be available on this time.</p><br>
            <a href="{{link}}">
                <img style="width:100%;" src="https://s3.fugu.chat/default/6MKLIAUwKR.1599134331642.png">
            </a>
            <br>
            <p style="text-align: center;">
                <img src="{{logo}}" tabindex="0" style="width: 30%;max-width: 200px;"><br><br>
                Copyright © 2020 {{appName}}. All Rights Reserved.</p>
        </div>
    </div>


</body></html>`;


var simpleTextMail = `{{{mail_text}}}`;


module.exports = {
  userInvitation    : userInvitation,
  businessSignup    : businessSignup,
  resetPassword     : resetPassword,
  welcomeEmail      : welcomeEmail,
  sendDomainsToEmail: sendDomainsToEmail,
  feedbackMail      : feedbackMail,
  gdprQueryMail     : gdprQueryMail,
  signUp            : signUp,
  newContactNumber  : newContactNumber,
  welcomeEmail      : welcomeEmail,
  requestEmail      : requestEmail,
  agentInvitation   : agentInvitation,
  resellerSignup    : resellerSignup,
  simpleTextMail    : simpleTextMail,
  messageEmail      : messageEmail,
  leaveEmail        : leaveEmail,
  signupEmail       : signupEmail,
  scheduleMeetingEmail : scheduleMeetingEmail
};
