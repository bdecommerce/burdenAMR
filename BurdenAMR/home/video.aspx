<%@ page title="" language="C#" masterpagefile="~/Base/Base.master" autoeventwireup="true" inherits="home_video, App_Web_hmrxtnlg" %>

<asp:Content ID="Content1" ContentPlaceHolderID="Head" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Content" Runat="Server">

    <%--TODO: implement library file manager to allow the website configuration to determine the external libraries to be included--%>
    <link type="text/css" href="../style/general/video-js.css" rel="stylesheet" />
    <script type="text/javascript" src="../javascript/general/video.js"></script>

  <!-- update the URL to the Flash SWF file -->
  <script type="text/javascript" language="javascript">
      videojs.options.flash.swf = "../images/global/video-js/video-js.swf";
  </script>

    <div id="divVideoContainer" runat="server"></div>
</asp:Content>