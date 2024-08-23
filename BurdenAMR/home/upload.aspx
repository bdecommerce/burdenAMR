<%@ page title="" language="C#" masterpagefile="~/Base/Base.master" autoeventwireup="true" inherits="home_upload, App_Web_hmrxtnlg" %>				

<asp:Content ID="Content1" ContentPlaceHolderID="Head" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="Content" Runat="Server">
    <script type="text/javascript" language="javascript">
        $(function () {
            var _class = util_forceString('<%= CssClass %>');

            $("body").addClass("ViewPortInline" + (_class != "" ? " " + _class : ""));

            if (util_forceString($("#" + '<%= hdLastUploadedFile.ClientID %>').val()) != "") {
                showLastUploadedLink();
                $("#" + '<%= spanSeperator.ClientID %>').show();
            }

            var _clSubmit = $('#' + '<%= clSubmit.ClientID %>');

            _clSubmit.attr("href", "javascript: void(0);");

            _clSubmit.off("click.submit");
            _clSubmit.on("click.submit", function () {
                $("[data-attr-file-upload=1]").fadeOut();
                $("#trFileUploadProgress").fadeIn();

                setTimeout(function () {
                    __doPostBack(util_replaceAll(_clSubmit.attr("id"), "_", "$", true), '')
                }, 10);

                return false;
            });

            $("[data-attr-file-upload=1]").show();
            $("#trFileUploadProgress").hide();


            if (util_forceInt('<%= IsUploadOnChange %>') == enCETriState.Yes) {
                $("#" + '<%= flUpload.ClientID %>').change(function () {
                    _clSubmit.trigger("click");
                });

                _clSubmit.hide();
            }

            parent.renderer_event_file_upload_ready('<%= ElementRefID %>');
        });

        function ParentAddUserError(msg, isFileUploadError) {
            isFileUploadError = util_forceBool(isFileUploadError, false);

            var _options = { "IsFileUploadError": isFileUploadError };

            parent.renderer_event_file_upload_error('<%= ElementRefID %>', msg, _options);
        }

        function ParentAddMessage(msg) {
            parent.ClearMessages();
            parent.AddMessage(msg, null, null, { "IsTimeout": true });
            parent.MessageCount(null, { "ScrollTopErrors": true });
        }

        function ParentFileUploadComplete(fileName, originalFileName, previewFileURL, prevUploadFileDeleted, md5) {
            ParentAddMessage("File has been successfully uploaded.");

            parent.renderer_event_file_upload_success({ "ElementRefID": '<%= ElementRefID %>', "UploadFileName": fileName, "OriginalFileName": originalFileName,
                "PreviewFileURL": previewFileURL, "PreviousUploadFileName": prevUploadFileDeleted, "MD5": md5
            });

            showLastUploadedLink();
        }

        function showLastUploadedLink() {
            var _lnkUploadedFile = $("#" + '<%= lnkUploadedFile.ClientID %>');

            _lnkUploadedFile.show();
        }

        function checkFileSize(obj) {
            if (obj && obj["files"] && obj.files.length) {
                var _maxSizeKB = util_forceInt('<%= CAppManager.MaxRequestLength %>');
                var _size = util_forceInt(obj.files[0].size) / 1024.00;

                if (_size > _maxSizeKB && parent) {
                    parent.ClearMessages();
                    parent.AddError("File: '" + obj.files[0].name + "' exceeds upload file size limit (" + '<%= MaxSizeFormatted %>' + ").");
                    obj.files = null;
                    obj.value = "";
                }
            }
        }
    </script>

    <table border="0" cellpadding="0" cellspacing="0" class="FileUploadContainer">
        <tr>
            <td colspan="2" align="left" >
                <span class="FileUploadLimitLabel">Max file size: <asp:Label ID="lblSize" runat="server" /></span> 
                <span id="spanSeperator" runat="server" style="display: none;">&nbsp;|&nbsp;</span>
                <a id="lnkUploadedFile" runat="server" class="FileUploadedLink" target="_blank" style="display: none;">Current Uploaded File</a>                
            </td>
        </tr>
        <tr data-attr-file-upload="1">
            <td><asp:FileUpload ID="flUpload" onblur="checkFileSize(this)" runat="server" data-mini="true" /></td>
            <td><asp:LinkButton ID="clSubmit" runat="server" data-role="button" data-mini="true">Upload File</asp:LinkButton></td>
        </tr>
        <tr id="trFileUploadProgress" style="display: none;">
            <td align="left" valign="middle" colspan="2">
                <div class="FileUploadProgressIndicator">Uploading file...please wait.</div>
            </td>
        </tr>
    </table>

    <asp:HiddenField ID="hdLastUploadedFile" runat="server" />
    <asp:HiddenField ID="hdLastUploadFilePath" runat="server" />
    <asp:HiddenField ID="hdLastUploadFileOriginalName" runat="server" />
</asp:Content>