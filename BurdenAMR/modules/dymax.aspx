<%@ page language="C#" masterpagefile="~/Base/Base.master" autoeventwireup="true" inherits="modules_dymax, App_Web_4n3440qg" %>

<asp:Content ID="Content1" runat="server" ContentPlaceHolderID="Head">
    <style type="text/css">

        .login-row input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 30px rgb(249, 249, 249) inset;
        }

        body, .ui-page
        {
            background-image: none;
            background: #FAFAFA;
            margin: 0em;
            padding: 0em;
            color: #333333;
            font-family: Arial;
        }

        .MessageContainer
        {
            position: fixed;
            top: 0px;
            left: 0px;
            width: 100%;
            background-color: #FFFFFF;
            color: #333333;
            padding: 0em;
            margin: 0em;
            z-index: 100;
        }

        .MessageContainer li
        {
            cursor: pointer;
            position: relative;
            list-style-type: none;
            padding: 0.5em;
            padding-right: 10em;
            width: 90%;
            width: calc(100% - 11em);
            
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .MessageContainer li:hover
        {
            opacity: 0.7;
        }

        .MessageContainer li .ui-li-count
        {
            position: absolute;
            right: 0.25em;
            top: 0.5em;
            text-align: right;
            text-transform: uppercase;
            color: #808080;
        }

        .logo
        {
            background: #FFFFFF;
            text-align: right;
            border-bottom: 0.1em solid #CCCCCC;
            position: relative;
            height: 72px;
            cursor: default;
        }

        .logo .page-title
        {
            position: absolute;
            left: 10px;
            top: 15px;
            font-size: 2em;
            text-transform: uppercase;
            color: #999999;
        }

        .content
        {
            text-align: center;
            margin-top: 5%;
        }

        .login-row
        {
            margin-bottom: 1em;
        }

        .login-row .heading
        {
            text-transform: uppercase;
            font-weight: bold;
            color: #808080;
        }

        .login-row .heading,
        .login-row .field
        {
            display: inline-block;
            vertical-align: top;
        }

        .login-row .heading
        {
            padding-top: 1em;
            padding-right: 0.5em;
            width: 6.5em;
        }

        .login-row .field
        {
            width: 30%;
        }

        .login-row .field div.ui-input-text
        {
            margin: 0em;
            border-radius: 2px;
            padding: 0.5em;
            border-color: #CCCCCC;
        }

        .login-row .EnterButton
        {
            margin: 0em;
        }

        .EnterButton .ui-btn-text,
        .ui-checkbox .ui-btn-text
        {
            color: #808080;
        }

        .EnterButton .ui-icon
        {
            background-color: #ff6a00;
        }

        .login-block .ui-checkbox .ui-icon
        {
            background-color: #999999;
        }

        .login-block .ui-checkbox .ui-icon.ui-icon-checkbox-on
        {
            background-color: #ff6a00;
        }

        .login-block .ui-checkbox .ui-btn-inner
        {
            padding-top: 0.35em;
            padding-bottom: 0.35em;
        }

        .login-block
        {
            display: inline-block;
            vertical-align: top;
        }

        h3
        {
            text-align: left;
            color: #808080;
            text-transform: uppercase;
            margin-bottom: 0.25em;
        }

    </style>

    <script type="text/javascript">
        $(function () {
            $mobileUtil.Configuration.BlockUI.SetTransparentMode({ "IsIndicatorMode": true });
            $mobileUtil.Configuration.Notification.Type = enCNotificationComponentType.Inline;

            util_configureKeyPress($mobileUtil.Find("#" + "<%= tbUsername.ClientID %>" + ", #" + "<%= tbPassword.ClientID %>"), KEY_CODES.ENTER, function () {
                __doPostBack(util_replaceAll("<%= clSubmit.ClientID %>", "_", "$"), '');
            });
        });

        function onForgotPasswordToggle(obj) {
            var $btn = $(obj);

            if ($btn.data("is-busy")) {
                return;
            }

            $btn.data("is-busy", true);

            var $vw = $mobileUtil.Find("#divResetPasswordForm");
            var _visible = $vw.is(":visible");

            $vw.toggle("height", function () {
                $btn.removeData("is-busy");
                $mobileUtil.ButtonUpdateIcon($btn, _visible ? "arrow-d" : "arrow-u");
            });
        }

        function resetPassword(obj) {
            var $btn = $(this);
            var $tb = $mobileUtil.Find("#tbForgotPassword");
            var _email = util_trim($tb.val());

            $tb.val(_email);

            if (_email == "") {
                AddUserError("E-mail address is required.", { "IsTimeout": true });
            }
            else {
                GlobalService.EmailForgotPassword(_email, ext_requestSuccess(function (serviceResult) {
                    if (!util_isNullOrUndefined(serviceResult) && serviceResult[enColCServiceResultProperty.ErrorType] == enCEServiceErrorType.Validation) {
                        AddError(serviceResult[enColCServiceResultProperty.ErrorMessage]);
                    }
                    else if (ext_getServiceResultData(serviceResult) == true) {
                        $tb.val("");
                        AddMessage("An e-mail has been sent to " + _email + ", please follow the instructions to reset your password.", null, null, {
                            "IsTimeout": true, "IsDurationLong": true
                        });

                        $mobileUtil.Find("#clForgotPassword").trigger("click");
                    }
                    else {
                        AddError(MSG_CONFIG.UnexpectedError, null, { "IsTimeout": true, "IsDurationLong": true });
                    }
                }, false));
            }
        }

    </script>

</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="Content" Runat="Server">

    <ul class="MessageContainer"></ul>

    <div class="DisableUserSelectable logo">
        <div class="page-title">
            <%= CUtils.HtmlEncode(PageTitle) %>
        </div>
        <a id="clHome" runat="server" href="" target="_self" data-rel="external" data-role="none" style="margin-right: 0.25em;">
            <img id="imgHeaderLogo" runat="server" alt="" src="" height="72" />
        </a>
    </div>

    <div class="content" style="min-width: 1024px;">
        <div class="login-row">
            <div class="heading">Username:</div>
            <div class="field">
                <input id="tbUsername" runat="server" type="text" placeholder="DYMAXIUM / XCENDA E-MAIL" data-mini="true" data-inline="true" />
            </div>
        </div>

        <div class="login-row">
            <div class="heading">Password:</div>
            <div class="field">
                <input id="tbPassword" runat="server" type="text" placeholder="PASSWORD" data-mini="true" data-inline="true" />
            </div>
        </div>

        <div class="login-row">
            <div class="heading">&nbsp;</div>
            <div class="field" style="text-align: left;">
                
                <div class="login-block" style="margin-right: 1em;">
                    <label data-corners="false" data-mini="true">Remember me<input id="cbRememberMe" runat="server" type="checkbox" /></label>
                </div>

                <div class="login-block">
                    <label data-corners="false" data-mini="true">Keep me logged in<input id="cbKeepLoggedIn" runat="server" type="checkbox" /></label>
                </div>
            </div>
        </div>

        <div class="login-row">
            <div class="heading">&nbsp;</div>
            <div class="field" style="text-align: right;">
                <div style="position: relative; height: 40px;">

                    <a id="clForgotPassword" class="EnterButton" data-role="button" data-corners="false" data-mini="true" data-inline="true" 
                       data-iconpos="right" data-icon="arrow-d" style="position: absolute; left: 0em;" onclick="onForgotPasswordToggle(this);">Forgot Password?</a>

                    <a id="clSubmit" runat="server" class="EnterButton" data-role="button" data-corners="false" data-mini="true" data-inline="true" 
                        data-iconpos="right" data-icon="arrow-r" style="position: absolute; right: 0em;">LOGIN</a>
                </div>

                <div id="divResetPasswordForm" style="display: none; text-align: right; margin-top: 0.25em;">
                    <h3>Forgot Password</h3>
                    <input id="tbForgotPassword" type="text" placeholder="DYMAXIUM / XCENDA E-MAIL" data-mini="true" data-inline="true" />
                    <div style="margin-top: 0.5em;">
                        <a id="clResetPassword" class="EnterButton" data-role="button" data-corners="false" data-mini="true" data-inline="true" 
                            data-iconpos="right" data-icon="arrow-r" onclick="resetPassword(this);">SUBMIT</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</asp:Content>