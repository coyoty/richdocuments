/* globals FileList, OCA.Files.fileActions, oc_debug */
var odfViewer = {
	isDocuments : false,
	supportedMimesReadWrite: [
		'application/vnd.oasis.opendocument.text',
		'application/vnd.oasis.opendocument.spreadsheet',
		'application/vnd.oasis.opendocument.graphics',
		'application/vnd.oasis.opendocument.presentation',
		'application/vnd.lotus-wordpro',
		'image/svg+xml',
		'application/vnd.visio',
		'application/vnd.wordperfect',
		'application/msonenote',
		'application/msword',
		'application/rtf',
		'text/rtf',
		'text/plain',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
		'application/vnd.ms-word.document.macroEnabled.12',
		'application/vnd.ms-word.template.macroEnabled.12',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
		'application/vnd.ms-excel.sheet.macroEnabled.12',
		'application/vnd.ms-excel.template.macroEnabled.12',
		'application/vnd.ms-excel.addin.macroEnabled.12',
		'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.openxmlformats-officedocument.presentationml.template',
		'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
		'application/vnd.ms-powerpoint.addin.macroEnabled.12',
		'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
		'application/vnd.ms-powerpoint.template.macroEnabled.12',
		'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'
	],

	register : function() {
		var i,
			mimeReadOnly,
			mimeReadWrite;

		for (i = 0; i < odfViewer.supportedMimesReadWrite.length; ++i) {
			mimeReadOnly = odfViewer.supportedMimesReadWrite[i];
			OCA.Files.fileActions.register(mimeReadOnly, 'View', OC.PERMISSION_READ, '', odfViewer.onEdit);
			OCA.Files.fileActions.setDefault(mimeReadOnly, 'View');
		}
		for (i = 0; i < odfViewer.supportedMimesReadWrite.length; ++i) {
			mimeReadWrite = odfViewer.supportedMimesReadWrite[i];
			OCA.Files.fileActions.register(
					mimeReadWrite,
					'Edit',
					OC.PERMISSION_UPDATE,
					OC.imagePath('core', 'actions/rename'),
					odfViewer.onEdit,
					t('richdocuments', 'Edit')
			);
			OCA.Files.fileActions.register(
				mimeReadWrite,
				'View',
				OC.PERMISSION_READ,
				OC.imagePath('core', 'actions/rename'),
				odfViewer.onEdit,
				t('richdocuments', 'View')
			);
			OCA.Files.fileActions.setDefault(mimeReadWrite, 'View');
			OCA.Files.fileActions.setDefault(mimeReadWrite, 'Edit');
		}
	},

	dispatch : function(filename){
		odfViewer.onEdit(filename);
	},

	onEdit : function(fileName, context) {
		if(context) {
			var fileDir = context.dir;
			var fileId = context.$file.attr('data-id');
		}

		var viewer;
		if($('#isPublic').val() === '1') {
			viewer = OC.generateUrl(
				'apps/richdocuments/public?shareToken={shareToken}&fileName={fileName}&requesttoken={requesttoken}',
				{
					shareToken: $('#sharingToken').val(),
					fileName: fileName,
					dir: fileDir,
					requesttoken: OC.requestToken
				}
			);
		} else {
			viewer = OC.generateUrl(
				'apps/richdocuments/index?fileId={fileId}_{dir}&requesttoken={requesttoken}',
				{
					fileId: fileId,
					dir: fileDir,
					requesttoken: OC.requestToken
				}
			);
		}

		if(context) {
			FileList.setViewerMode(true);
		}

		var $iframe = $('<iframe id="richdocumentsframe" style="width:100%;height:100%;display:block;position:absolute;top:0;" src="'+viewer+'" />');
		if ($('#isPublic').val()) {
			// force the preview to adjust its height
			$('#preview').append($iframe).css({height: '100%'});
			$('body').css({height: '100%'});
			$('#content').addClass('full-height');
			$('footer').addClass('hidden');
			$('#imgframe').addClass('hidden');
			$('.directLink').addClass('hidden');
			$('.directDownload').addClass('hidden');
			$('#controls').addClass('hidden');
			$('#content').addClass('loading');
		} else {
			$('#app-content').append($iframe);
		}

		$('#app-content #controls').addClass('hidden');
		$('#app-content').append($iframe);

		$.ajax({type: 'GET', url: OC.filePath('richdocuments', 'ajax', 'generate.php'), data: {id: context.$file.attr('data-id')}, async: false, success: function(result) {
			if(result.status=="success"){
				var $chatroom = $('<iframe id="chatroom" data-chatroom-password="'+result.password+'" data-chatroom-title="'+fileName+'" data-chatroom-name="'+result.name+'" hidden />');
				$('#app-content').append($chatroom);
			}

		}, error: function(xhr, textStatus, errorThrown){
			password=errorThrown;
		}});
	},


	onClose: function() {
		if(typeof FileList !== "undefined") {
			FileList.setViewerMode(false);
		}
		$('#app-content #controls').removeClass('hidden');
		$('#richdocumentsframe').remove();
		$('#chatroom').remove();
	},

	registerFilesMenu: function() {
		var ooxml = false;

		var docExt, spreadsheetExt, presentationExt;
		var docMime, spreadsheetMime, presentationMime;
		if (ooxml) {
			docExt = 'docx';
			spreadsheetExt = 'xlsx';
			presentationExt = 'pptx';
			docMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			spreadsheetMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			presentationMime =	'application/vnd.openxmlformats-officedocument.presentationml.presentation';
		} else {
			docExt = 'odt';
			spreadsheetExt = 'ods';
			presentationExt = 'odp';
			docMime = 'application/vnd.oasis.opendocument.text';
			spreadsheetMime = 'application/vnd.oasis.opendocument.spreadsheet';
			presentationMime = 'application/vnd.oasis.opendocument.presentation';
		}

		(function(OCA){
			OCA.FilesLOMenu = {
				attach: function(newFileMenu) {
					var self = this;

					newFileMenu.addMenuEntry({
						id: 'add-' + docExt,
						displayName: t('richdocuments', 'Document'),
						templateName: 'New Document.' + docExt,
						iconClass: 'icon-filetype-document',
						fileType: 'x-office-document',
						actionHandler: function(filename) {
							self._createDocument(docMime, filename);
						}
					});

					newFileMenu.addMenuEntry({
						id: 'add-' + spreadsheetExt,
						displayName: t('richdocuments', 'Spreadsheet'),
						templateName: 'New Spreadsheet.' + spreadsheetExt,
						iconClass: 'icon-filetype-spreadsheet',
						fileType: 'x-office-spreadsheet',
						actionHandler: function(filename) {
							self._createDocument(spreadsheetMime, filename);
						}
					});

					newFileMenu.addMenuEntry({
						id: 'add-' + presentationExt,
						displayName: t('richdocuments', 'Presentation'),
						templateName: 'New Presentation.' + presentationExt,
						iconClass: 'icon-filetype-presentation',
						fileType: 'x-office-presentation',
						actionHandler: function(filename) {
							self._createDocument(presentationMime, filename);
						}
					});
				},

				_createDocument: function(mimetype, filename) {
					OCA.Files.Files.isFileNameValid(filename);
					filename = FileList.getUniqueName(filename);

					$.post(
						OC.generateUrl('apps/richdocuments/ajax/documents/create'),
						{ mimetype : mimetype, filename: filename, dir: $('#dir').val() },
						function(response){
							if (response && response.status === 'success'){
								FileList.add(response.data, {animate: true, scrollTo: true});
							} else {
								OC.dialogs.alert(response.data.message, t('core', 'Could not create file'));
							}
						}
					);
				}
			};
		})(OCA);

		OC.Plugins.register('OCA.Files.NewFileMenu', OCA.FilesLOMenu);
	}
};

$(document).ready(function() {
	if ( typeof OCA !== 'undefined'
		&& typeof OCA.Files !== 'undefined'
		&& typeof OCA.Files.fileActions !== 'undefined'
	) {
		odfViewer.register();
		odfViewer.registerFilesMenu();
	}
});

// FIXME: Hack for single public file view since it is not attached to the fileslist
$(document).ready(function(){
	// FIXME: FIlter compatible mime types
	if ($('#isPublic').val() && odfViewer.supportedMimesReadWrite.indexOf($('#mimetype').val()) !== -1) {
		odfViewer.onEdit($('#filename').val());
	}
});

$(document).ready(function() {
	var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
	var eventer = window[eventMethod];
	var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

	eventer(messageEvent,function(e) {
		if(e.data === 'close') {
			odfViewer.onClose();
		} else if(e.data === 'loading') {
			$('#content').removeClass('loading');
		}
	}, false);
});
