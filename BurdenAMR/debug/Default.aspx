<%@ page title="" language="C#" masterpagefile="~/Base/Base.master" autoeventwireup="true" inherits="debug_Default, App_Web_tndxr1hn" %>

<asp:Content ID="Content1" ContentPlaceHolderID="Head" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Content" Runat="Server">

    <script type="text/javascript" language="javascript">
        $(function () {
            $("#clHeader, #clToggleMode, #clClearCache").click(function () {
                postbackControl($(this).attr("id"), "");
                return false;
            });
        });

        function postbackControl(ctlID, arguments) {
            __doPostBack(ctlID, util_forceString(arguments));
        }
    </script>

    <div id="divContent" runat="server" visible="false" style="padding-left: 2em; padding-right: 2em;">
        <h2 id="clHeader" style="cursor: pointer; width: 100%; border-bottom: 0.1em solid #CCCCCC;">Application - Debug</h2>

        <div id="divMessage" runat="server" style="font-size: 0.8em; padding-left: 1em;" visible="false"></div>

        <div id="divResults" runat="server"></div>

        <div>
            <a id="clToggleMode" data-role="button" data-mini="true" data-theme="b" data-inline="true" href="javascript: void(0);">Toggle Authentication Mode</a>
            <a id="clClearCache" data-role="button" data-mini="true" data-theme="b" data-inline="true" href="javascript: void(0);">Clear Application Cache</a>
        </div>
    </div>
</asp:Content>