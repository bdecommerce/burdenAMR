<%@ page title="" language="C#" masterpagefile="~/Base/Base.master" autoeventwireup="true" inherits="error_default, App_Web_5gqevpzx" %>

<asp:Content ID="Content1" ContentPlaceHolderID="Head" runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Content" runat="Server">

    <div class="ApplicationErrorView">
        <span id="divErrorMessage" runat="server" class="Title">An unexpected error has occurred while processing your request. Please try again.</span>
        Click <a id="clReturn" runat="server" href="javascript: void(0);">here</a> to go back.
    </div>

    <script type="text/javascript">
        $(function () {
            var _class = util_forceString('<%= CssClass %>');

            $("body").addClass("ViewPortInline" + (_class != "" ? " " + _class : ""));

        });

    </script>

</asp:Content>
