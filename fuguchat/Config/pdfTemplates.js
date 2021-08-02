const invoice = `

<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>{{{companyName}}} - Invoice</title>
</head>

<body style="letter-spacing: .7px;">

    <table style="background: #fff;margin: 0 auto;">
        <tr>
            <td></td>
            <td>
                <div>
                    <table style="width: 100%;">
                        <tr>
                            <td rowspan="3">
                                <p style="
    margin: 0px 4px 0px 0 !important;
    font-family: arial, sans-serif;
    color: rgba(4, 4, 4, 0.61);
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 100;
    padding-top: 5px;"><span style="
    min-width: 80px;
    display: inline-block;">Invoice</span> <span style="    margin: 0 !important;
    font-family: arial, sans-serif;
    font-weight: lighter;
    color: rgba(0, 0, 0, 0.7);
    margin-top: -5px;
    font-weight: 300;">#{{{invoice_number}}}</span></p>
                                <p style="margin: 0 4px 12px 0 !important;
    font-family: arial, sans-serif;
    color: rgba(4, 4, 4, 0.61);
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 100;
    padding-top: 0;"><span style="
    min-width: 80px;
    display: inline-block;">Date</span> <span style="    margin: 0 !important;
    font-family: arial, sans-serif;
    font-weight: lighter;
    color: rgba(0, 0, 0, 0.7);
    margin-top: -5px;
    font-weight: 300;">{{{date}}}</span></p>

                            </td>
                            <td style="text-align: right;"></td>
                        </tr>
                        <tr>
                            <td style="text-align: right;">
                                <img style="width:120px;" src="https://fuguchat.s3.ap-south-1.amazonaws.com/image/Vdkgwve7Wo.1558002947298.png" />
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td style="height: 20px;">
            </td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td>
                <div>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: left;">
                                <p style="
    margin: 0 !important;
    font-family: arial, sans-serif;
    color: #949494;
    font-size: 14px;
    line-height: 23px;"><span style="text-transform: uppercase;">{{{customer_name}}}</span><br />
                                    <span style="">{{{company_name}}}</span><br />
                                    <span style="">{{{customer_email}}}</span><br />
                                    <span style="">Invoice Month - <b
                                            style="color: #595353;">{{{duration}}}</b></span><br />
                                </p>
                            </td>
                            <td style="text-align: right;">

                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td></td>
        </tr>
        <tr>
            <td style="height: 20px;"></td>
        </tr>
        <tr>
            <td></td>
            <td>
                <div>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: left;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 12px; letter-spacing: 1px;">
                                    Description</p>
                            </td>
                            <td style="text-align: left; width:110px;">
                            </td>
  
                            <td style="text-align: right;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 12px; letter-spacing: 1px;">
                                    Amount ($)</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4">
                                <hr>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: left;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 12px; letter-spacing: 1px;">
                                    {{{description}}}</p>
                            </td>
                            <td style="text-align: left; width:110px;">
                            </td>
   
                            <td style="text-align: right;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 12px; letter-spacing: 1px;">
                                    {{{total_amount}}}</p>
                            </td>
                        </tr>
                    </table>
                    <hr>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: left; padding-top: 10px;">
                                <p
                                    style=" margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 14px; letter-spacing: 1px; ">
                                    Subtotal</p>
                            </td>
                            <td></td>
                            <td style="text-align: right; padding-top: 10px;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; font-weight: bold; color: #595353; font-size: 14px; ">
                                    {{{total_amount}}}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: left; padding-top: 10px;">
                                <p
                                    style=" margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 14px; letter-spacing: 1px; ">
                                    Tax({{{taxPercentage}}}%)</p>
                            </td>
                            <td></td>
                            <td style="text-align: right; padding-top: 10px;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; font-weight: bold; color: #595353; font-size: 14px; ">
                                    {{{tax}}}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: left; padding-top: 10px;">
                                <p
                                    style=" margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 14px; letter-spacing: 1px; ">
                                    Credit Adjusted</p>
                            </td>
                            <td></td>
                            <td style="text-align: right; padding-top: 10px;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; font-weight: bold; color: #595353; font-size: 14px; ">
                                    {{{creditAdjusted}}}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: left; padding-top: 10px;">
                                <p
                                    style=" margin: 0 !important; font-family: arial, sans-serif; color: #302b2a; font-size: 14px; letter-spacing: 1px; ">
                                    Total</p>
                            </td>
                            <td></td>
                            <td style="text-align: right; padding-top: 10px;">
                                <p
                                    style="margin: 0 !important; font-family: arial, sans-serif; font-weight: bold; color: #595353; font-size: 14px; ">
                                    {{{total_amount}}}</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td></td>
        </tr>
        <tr>
            <td style="height: 10px;"></td>
        </tr>
        <tr>
            <td></td>
            <td>
                <div>
                    <table
                        style="width: 100%; height: 150px;border: 1px solid rgba(51, 51, 51, 0.7);background: rgba(51, 51, 51, 0.03);">
                        <tr>
                            <td style="padding-left: 10px;">
                                <p style="
    margin: 0 !important;
    font-family: arial, sans-serif;
    color: #333;
    font-size: 13px;
    letter-spacing: 1px;
    line-height: 15px;
    text-align: center;">Thank you for using {{{reseller_company_name}}}. If you have any questions, please contact us
                                    at <a style="color: #333; text-decoration: underline;"
                                        href="mailto:support@fuguchat.com">support@fuguchat.com</a>
                                    <br />
                                    <img style="width:100px; margin-top: 18px;margin-bottom: 7px;"
                                        src="https://fuguchat.s3.ap-south-1.amazonaws.com/image/Vdkgwve7Wo.1558002947298.png" />
                                    <div style="font-family: arial, sans-serif;
    color: #333;
    font-size: 13px;
    letter-spacing: 1px;
    line-height: 15px;
    text-align: center;
	margin-top: 10px">FUGU
                                        <br />Clicklabs Inc, 
                                        600 1st Ave, Seattle Suite 114, Seattle WA 98104,
                                        United States of America
                                        
                                        +1 206-257-2964 (US)</div>
                        </tr>
                    </table>
                </div>
            </td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td>
                <div>
                    <table style="width: 100%; margin-bottom: 4px;">
                        <tr>
                            <td>
                                <p
                                    style="text-align: center; font-family: arial, sans-serif;margin-top: 20px;font-size: 12px; color: #929292;">
                                    This is a computer generated document. No signature is required.</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td></td>
        </tr>

    </table>


</body>

</html>`


module.exports = {
    invoice : invoice
  };
  