import './core.js';

let core = window.core !== undefined ? window.core : {};

const util = {

	iterObj: function (o, f) {
		var prop;
		for (prop in o) {
			if (o.hasOwnProperty(prop)) {
				f(prop, o[prop]);
			}
		}
	},


	emailIsValid: function (email) {
		return /\S+@\S+\.\S+/.test(email);
	},
	

	localeDT: function (timestamp) {
		if (timestamp) {
			timestamp = timestamp.replace(' ','T');
			return new Date(timestamp).toLocaleString();
		} else {
			return '';
		}
	},


	localeDate: function (timestamp) {
		if (timestamp) {
			timestamp = timestamp.replace(' ','T');
			return new Date(timestamp).toLocaleDateString();
		} else {
			return '';
		}
	},

	
	localeTime: function (timestamp) {
		if (timestamp) {
			timestamp = timestamp.replace(' ','T');
			return new Date(timestamp).toLocaleTimeString();
		} else {
			return '';
		}
	},

	
	formatDT: function (timestamp, format) {
		timestamp = timestamp.replace(' ','T');
		var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var dt = new Date(timestamp);
		var year = dt.getFullYear();
		var monthName = months_arr[dt.getMonth()];
		var month = "0" + (dt.getMonth() + 1);
		var day = "0" + dt.getDate();
		var hours = "0" + dt.getHours();
		var minutes = "0" + dt.getMinutes();
		var seconds = "0" + dt.getSeconds();
		var result;
		if (format !== undefined) {
			format = format.replace('dd', day.substr(-2));
			format = format.replace('MMM', monthName);
			format = format.replace('MM', month.substr(-2));
			format = format.replace('yyyy', year);
			format = format.replace('hh', hours.substr(-2));
			format = format.replace('mm', minutes.substr(-2));
			format = format.replace('ss', seconds.substr(-2));
			result = format;
		} else {
			// MM-dd-yyyy h:m:s format
			result = monthName+'-'+day.substr(-2)+'-'+year+' '+hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
		}
		return result;	
	},

	
	addToDate: function (date, qty, scale) {
		qty = parseInt(qty, 10);
		const vals = [
			date.getFullYear() + (scale === 'year' ? qty : 0),
			date.getMonth() + (scale === 'month' ? qty : 0),
			date.getDate() + (scale === 'day' ? qty : 0),
			date.getHours() + (scale === 'hour' ? qty : 0),
			date.getMinutes() + (scale === 'minute' ? qty : 0),
			date.getSeconds() + (scale === 'second' ? qty : 0),
			date.getMilliseconds() + (scale === 'millisecond' ? qty : 0)
		];
		return new Date(...vals);
	},

	
	camelize: function (s) {
		var r = '', a = s.split(' ');
		a.forEach((w, idx) => {
			r = r + w.charAt(0).toUpperCase() + w.slice(1);
			if (idx < a.length-1) {
				r += ' ';
			}
		});
		return r;
	},
	
	
	formatBytes: function (bytes, dp) {
		let neg = '';
		if (bytes == 0) return '0 b';
		if (bytes < 0) {
			neg = '-';
			bytes = Math.abs(bytes);
		}
		var k = 1024,
			dm = dp <= 0 ? 0 : dp || 2,
			sizes = [' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return neg + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
	},

	fileExtension: function (fileName) {
		var ext = fileName.split('.').slice(-1).join('');
		ext = ext.toLowerCase();
		if (fileName.toLowerCase() === ext) {
			ext = '';
		}
		return ext;
	},
	
	ab2hex: function (buf) {
		return Array.prototype.map.call(
			new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)
		).join('');
	},	


	hex2bytes: function (hex) {
		return new Uint8Array(
			hex.match(/[\da-f]{2}/gi).map(function (h) {
				return parseInt(h, 16);
			}));
	},

	
	hex2ab: function (hex) {
		var typedArray = core.util.hex2bytes(hex);
		return typedArray.buffer;
	},

	
	abSplit: function (ab, length, fmt) {
		let pos = 0, result = [];
		while (pos < ab.byteLength) {
			switch (fmt) {
			case 'str':
				result.push(core.util.ab2str(ab.slice(pos, pos += length)));
				break;
			case 'b64':
				result.push(core.util.ab2b64(ab.slice(pos, pos += length)));
				break;
			case 'hex':
				result.push(core.util.ab2hex(ab.slice(pos, pos += length)));
				break;
			default:
				result.push(ab.slice(pos, pos += length));
			}
		}
		return result;
	},

	abEqual: function (ab1, ab2)
	{
		if (ab1.byteLength != ab2.byteLength) return false;
		var dv1 = new Int8Array(ab1);
		var dv2 = new Int8Array(ab2);
		for (var i = 0 ; i != ab1.byteLength ; i++)
		{
			if (dv1[i] != dv2[i]) return false;
		}
		return true;
	},
	
	/**
	 * String to ArrayBuffer
	 * from: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	 * @param {String} str source string
	 * @returns {ArrayBuffer}
	 */
	str2ab: function (str) {
		const buf = new ArrayBuffer(str.length);
		const bufView = new Uint8Array(buf);
		for (let i = 0, strLen = str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	},


	/**
	 * ArrayBuffer to String
	 * from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	 * @param {ArrayBuffer} buf source buffer
	 * @returns {String}
	 */
	ab2str: function (buf) {
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	},

	
	/**
	 * concatenate an arbitrary number of arraybuffers
	 *
	 * @param {Array} buffers array of buffers to combine
	 * @returns {ArrayBuffer}
	 */
	abConcat: function (buffers) {
		function join (ab1, ab2) {
			var tmp = new Uint8Array(ab1.byteLength + ab2.byteLength);
			tmp.set(new Uint8Array(ab1), 0);
			tmp.set(new Uint8Array(ab2), ab1.byteLength);
			return tmp.buffer;
		}
		
		var result = new ArrayBuffer();
		buffers.forEach((ab) => {
			result = join(result, ab);
		});
		return result;
	},
	
	
	/**
	 * create a UUIDv4 (random UUID)
	 *
	 * references:
	 *  - https://gist.github.com/adrianorsouza/2b360807064bf9d6ab218b62b076f539
     *  - http://www.ietf.org/rfc/rfc4122.txt
	 *
	 * @returns {String} UUIDv4
	 */
    createUUID: function(){
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    },

	
	/**
	 * format a hex string to a UUID
	 * e.g. b762ff61115641208f1efb2364925378 to b762ff61-1156-4120-8f1e-fb2364925378
	 *
	 * @param {String} str hex encoded UUID without formatting
	 * @returns {String} UUID encoded string
	 */
	hex2uuid: function (hex) {
		if (typeof(hex) === 'string' && hex.length === 32) {
			return [
				hex.slice(0, 8),
				hex.slice(8, 12),
				hex.slice(12, 16),
				hex.slice(16, 20),
				hex.slice(20)
			].join('-');
		} else {
			throw "Parameter is not a valid UUID";
		}
		
	},
	
	/**
	 * Convert string uuid to bytes
	 *
	 * @returns {ArrayBuffer} uuid
	 */
	uuid2ArrayBuffer: function (uid) {
		var hex = uid.split('-').join('');
		return core.util.hex2bytes(hex).buffer;
	},
	

	// arrayBuffer To Base64 String
	ab2b64: function (ab) {
		var byteArray = new Uint8Array(ab);
		var byteString = '';
		for (var i=0; i<byteArray.byteLength; i++) {
			byteString += String.fromCharCode(byteArray[i]);
		}
		return btoa(byteString);
	},

	b642ab: function (b64str) {
		var byteStr = atob(b64str);
		var bytes = new Uint8Array(byteStr.length);
		for (var i = 0; i < byteStr.length; i++) {
			bytes[i] = byteStr.charCodeAt(i);
		}
		return bytes.buffer;
	},

	// return value, or default if not defined
	getValue: function (value, def) {
		return value !== undefined ? value : def;
	},


	// padded hex 32 bit version of a number
	int2hex32: function (value) {
		return ("00000000" + (value).toString(16)).substr(-8);
	},

	safeHTML: function (unsafe) {
		if (typeof unsafe !== 'string') {
			return unsafe;
		} else {
			return unsafe
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&apos;");
		}
	},

	// print page
	printPage: function (sURL) {

		function closePrint () {
			document.body.removeChild(this.__container__);
		}

		function setPrint () {
			this.contentWindow.__container__ = this;
			this.contentWindow.onbeforeunload = closePrint;
			this.contentWindow.onafterprint = closePrint;
			this.contentWindow.focus(); // Required for IE
			this.contentWindow.print();
		}
		
		var oHiddFrame = document.createElement("iframe");
		oHiddFrame.onload = setPrint;
		oHiddFrame.style.position = "fixed";
		oHiddFrame.style.right = "0";
		oHiddFrame.style.bottom = "0";
		oHiddFrame.style.width = "0";
		oHiddFrame.style.height = "0";
		oHiddFrame.style.border = "0";
		oHiddFrame.src = sURL;

		document.body.appendChild(oHiddFrame);
	},

	
	formatItem: function(item, field) {
		switch (field.dataType) {
		case 'integer':
			if (field.labels !== undefined) {
				return field.labels[item] !== undefined ? field.labels[item] : '';
			} else {
				return item !== null ? item : '';
			}
		case 'weight':
			if (isNaN(item)) item = 0;
			return item > 0 ? Math.round(item * 100) : '';
		case 'yesno':
			return item === 1 ? 'yes' : 'no';
		case 'datetime':
			return core.util.localeDT(item);
		case 'date':
			return core.util.localeDate(item);
		case 'time':
			return core.util.localeTime(item);
		case 'duration':
			if (item !== null) {
				if (item === '0:0') {
					return '';
				} else {
					let dur = item.split(':');
					return `${dur[0]}d ${dur[1]}h`;
				}
			} else {
				return '';
			}
		case 'percentage':
			return item !== null ? item + '%' : '';
		case 'filesize':
			return item !== null ? core.util.formatBytes(item) : '';
		case 'fileicon':
			let ext = item !== null ? core.util.fileExtension(item) : '';
			if (ext !== '') {
				return `<div class="icon" style="background-image: url(/app/img/file-icons/high-contrast/${ext}.svg);"></div>`;
			} else {
				return '';
			}
		case 'icon':
			return item !== null ? '<div class="icon" style="background-image: url('+item+');"></div>' : ''; 
		default:
			if (item === null) {
				return '-';
			} else {
				return core.util.safeHTML(item);
			}
		}
	},


	getObjectDescription: function(data, value) {
		for (let idx = 0; idx < data.length; idx++) {
			if (data[idx].value === value) {
				return data[idx].description;
			}
		}

		return '';
	}


};

core.namespace('core.util', util);
