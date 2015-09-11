var KBEngine = KBEngine || {};

/*-----------------------------------------------------------------------------------------
					    	JavaScript Inheritance
-----------------------------------------------------------------------------------------*/
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
KBEngine.Class = function(){};
KBEngine.Class.extend = function (prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = Object.create(_super);
    initializing = false;
    fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
        // Check if we're overwriting an existing function
        prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" && fnTest.test(prop[name]) ?
            (function (name, fn) {
                return function () {
                    var tmp = this._super;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;

                    return ret;
                };
            })(name, prop[name]) :
            prop[name];
    }

    // The dummy class constructor
    function Class() {
        // All construction is actually done in the init method
        if (!initializing) {
            if (!this.ctor) {
                if (this.__nativeObj)
                    KBEngine.INFO_MSG("No ctor function found!");
            }
            else {
                this.ctor.apply(this, arguments);
            }
        }
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
};

/*-----------------------------------------------------------------------------------------
												global
-----------------------------------------------------------------------------------------*/
KBEngine.PACKET_MAX_SIZE		= 1500;
KBEngine.PACKET_MAX_SIZE_TCP	= 1460;
KBEngine.PACKET_MAX_SIZE_UDP	= 1472;

KBEngine.MESSAGE_ID_LENGTH		= 2;
KBEngine.MESSAGE_LENGTH_LENGTH	= 2;

KBEngine.CLIENT_NO_FLOAT		= 0;
KBEngine.KBE_FLT_MAX			= 3.402823466e+38;

/*-----------------------------------------------------------------------------------------
												number64bits
-----------------------------------------------------------------------------------------*/
KBEngine.INT64 = function(lo, hi)
{
	this.lo = lo;
	this.hi = hi;
	
	this.sign = 1;
	
	if(hi >= 2147483648)
	{
		this.sign = -1;
		if(this.lo > 0)
		{
			this.lo = (4294967296 - this.lo) & 0xffffffff;
			this.hi = 4294967295 - this.hi;
		}
		else
		{
			this.lo = (4294967296 - this.lo) & 0xffffffff;
			this.hi = 4294967296 - this.hi;
		}
	}
	
	this.toString = function()
	{
		var result = "";
		
		if(this.sign < 0)
		{
			result += "-"
		}
		
		var low = this.lo.toString(16);
		var high = this.hi.toString(16);
		
		if(this.hi > 0)
		{
			result += high;
			for(var i = 8 - low.length; i > 0; --i)
			{
				result += "0";
			}
		}
		result += low;
		
		return result;
		
	}
}

KBEngine.UINT64 = function(lo, hi)
{
	this.lo = lo;
	this.hi = hi;
	
	this.toString = function()
	{
		var low = this.lo.toString(16);
		var high = this.hi.toString(16);
		
		var result = "";
		if(this.hi > 0)
		{
			result += high;
			for(var i = 8 - low.length; i > 0; --i)
			{
				result += "0";
			}
		}
		result += low;
		return result;
	}
}

/*-----------------------------------------------------------------------------------------
												debug
-----------------------------------------------------------------------------------------*/
KBEngine.INFO_MSG = function(s)
{
	console.info(s);
}

KBEngine.DEBUG_MSG = function(s)
{
	console.debug(s);
}

KBEngine.ERROR_MSG = function(s)
{
	console.error(s);
}

KBEngine.WARNING_MSG = function(s)
{
	console.warn(s);
}

/*-----------------------------------------------------------------------------------------
												string
-----------------------------------------------------------------------------------------*/
KBEngine.utf8ArrayToString = function(array)
{
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;

    while(i < len)
    {
        c = array[i++];

        switch(c >> 4)
        {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
            out += String.fromCharCode(c);
            break;
            case 12: case 13:
            // 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    
    return out;
}

KBEngine.stringToUTF8Bytes = function(str) 
{
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff))
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

/*-----------------------------------------------------------------------------------------
												event
-----------------------------------------------------------------------------------------*/
KBEngine.EventInfo = function(classinst, callbackfn)
{
	this.callbackfn = callbackfn;
	this.classinst = classinst;
}

KBEngine.Event = function()
{
	this._events = {};
	
	this.register = function(evtName, classinst, strCallback)
	{
		var callbackfn = eval("classinst." + strCallback);
		if(callbackfn == undefined)
		{
			KBEngine.ERROR_MSG('KBEngine.Event::fire: not found strCallback(' + classinst  + ")!"+strCallback);  
			return;
		}

		var evtlst = this._events[evtName];
		if(evtlst == undefined)
		{
			evtlst = [];
			this._events[evtName] = evtlst;
		}
		
		var info = new KBEngine.EventInfo(classinst, callbackfn);
		evtlst.push(info);
	}
	
	this.deregister = function(evtName, classinst)
	{
		for(itemkey in this._events)
		{
			var evtlst = this._events[itemkey];
			while(true)
			{
				var found = false;
				for(var i=0; i<evtlst.length; i++)
				{
					var info = evtlst[i];
					if(info.classinst == classinst)
					{
						evtlst.splice(i, 1);
						found = true;
						break;
					}
				}
				
				if(!found)
					break;
			}
		}
	}
	
	this.fire = function()
	{
		if(arguments.length < 1)
		{
			KBEngine.ERROR_MSG('KBEngine.Event::fire: not found eventName!');  
			return;
		}

		var evtName = arguments[0];
		var evtlst = this._events[evtName];
		
		if(evtlst == undefined)
		{
			return;			
		}
		
		var ars = [];
		for(var i=1; i<arguments.length; i++) 
			ars.push(arguments[i]);
		
		for(var i=0; i<evtlst.length; i++)
		{
			var info = evtlst[i];
			if(arguments.length < 1)
			{
				info.callbackfn.apply(info.classinst);
			}
			else
			{
				info.callbackfn.apply(info.classinst, ars);
			}
		}
	}
}

KBEngine.Event = new KBEngine.Event();

/*-----------------------------------------------------------------------------------------
												memorystream
-----------------------------------------------------------------------------------------*/
KBEngine.MemoryStream = function(size_or_buffer)
{
	if(size_or_buffer instanceof ArrayBuffer)
	{
		this.buffer = size_or_buffer;
	}
	else
	{
		this.buffer = new ArrayBuffer(size_or_buffer);
	}

	this.rpos = 0;
	this.wpos = 0;
	
	/*
		union PackFloatXType
		{
			float	fv;
			uint32	uv;
			int		iv;
		};	
	*/
	KBEngine.MemoryStream.PackFloatXType = function()
	{
		this._unionData = new ArrayBuffer(4);
		this.fv = new Float32Array(this._unionData, 0, 1);
		this.uv = new Uint32Array(this._unionData, 0, 1);
		this.iv = new Int32Array(this._unionData, 0, 1);
	};
			
	//---------------------------------------------------------------------------------
	this.readInt8 = function()
	{
		var buf = new Int8Array(this.buffer, this.rpos, 1);
		this.rpos += 1;
		return buf[0];
	}

	this.readInt16 = function()
	{
		var v = this.readUint16();
		if(v >= 32768)
			v -= 65536;
		return v;
	}
		
	this.readInt32 = function()
	{
		var v = this.readUint32();
		if(v >= 2147483648)
			v -= 4294967296;
		return v;
	}

	this.readInt64 = function()
	{
		return new KBEngine.INT64(this.readUInt32(), this.readUInt32());
	}
	
	this.readUint8 = function()
	{
		var buf = new Uint8Array(this.buffer, this.rpos, 1);
		this.rpos += 1;
		return buf[0];
	}

	this.readUint16 = function()
	{
		var buf = new Uint8Array(this.buffer, this.rpos);
		this.rpos += 2;
		return ((buf[1] & 0xff) << 8) + (buf[0] & 0xff);
	}
		
	this.readUint32 = function()
	{
		var buf = new Uint8Array(this.buffer, this.rpos);
		this.rpos += 4;
		return (buf[3] << 24) + (buf[2] << 16) + (buf[1] << 8) + buf[0];
	}

	this.readUint64 = function()
	{
		return new KBEngine.UINT64(this.readUint32(), this.readUint32());
	}
	
	this.readFloat = function()
	{
		try
		{
			var buf = new Float32Array(this.buffer, this.rpos, 1);
		}
		catch(e)
		{
			var buf = new Float32Array(this.buffer.slice(this.rpos, this.rpos + 4));
		}
		
		this.rpos += 4;
		return buf[0];
	}

	this.readDouble = function()
	{
		try
		{
			var buf = new Float64Array(this.buffer, this.rpos, 1);
		}
		catch(e)
		{
			var buf = new Float64Array(this.buffer.slice(this.rpos, this.rpos + 8), 0, 1);
		}
		
		this.rpos += 8;
		return buf[0];
	}
	
	this.readString = function()
	{
		var buf = new Uint8Array(this.buffer, this.rpos);
		var i = 0;
		var s = "";
		
		while(true)
		{
			if(buf[i] != 0)
			{
				s += String.fromCharCode(buf[i]);
			}
			else
			{
				i++;
				break;
			}
			
			i++;
			
			if(this.rpos + i >= this.buffer.byteLength)
				throw(new Error("KBEngine.MemoryStream::readString: rpos(" + (this.rpos + i) + ")>=" + 
					this.buffer.byteLength + " overflow!"));
		}
		
		this.rpos += i;
		return s;
	}

	this.readBlob = function()
	{
		size = this.readUint32();
		var buf = new Uint8Array(this.buffer, this.rpos, size);
		this.rpos += size;
		return buf;
	}

	this.readStream = function()
	{
		var buf = new Uint8Array(this.buffer, this.rpos, this.buffer.byteLength - this.rpos);
		this.rpos = this.buffer.byteLength;
		return new KBEngine.MemoryStream(buf);
	}
	
	this.readPackXZ = function()
	{
		var xPackData = new KBEngine.MemoryStream.PackFloatXType();
		var zPackData = new KBEngine.MemoryStream.PackFloatXType();
		
		xPackData.fv[0] = 0.0;
		zPackData.fv[0] = 0.0;

		xPackData.uv[0] = 0x40000000;
		zPackData.uv[0] = 0x40000000;
			
		var v1 = this.readUint8();
		var v2 = this.readUint8();
		var v3 = this.readUint8();

		var data = 0;
		data |= (v1 << 16);
		data |= (v2 << 8);
		data |= v3;

		xPackData.uv[0] |= (data & 0x7ff000) << 3;
		zPackData.uv[0] |= (data & 0x0007ff) << 15;

		xPackData.fv[0] -= 2.0;
		zPackData.fv[0] -= 2.0;
	
		xPackData.uv[0] |= (data & 0x800000) << 8;
		zPackData.uv[0] |= (data & 0x000800) << 20;
			
		var data = new Array(2);
		data[0] = xPackData.fv[0];
		data[1] = zPackData.fv[0];
		return data;
	}

	this.readPackY = function()
	{
		var v = this.readUint16();
		return v;
	}
	
	//---------------------------------------------------------------------------------
	this.writeInt8 = function(v)
	{
		var buf = new Int8Array(this.buffer, this.wpos, 1);
		buf[0] = v;
		this.wpos += 1;
	}

	this.writeInt16 = function(v)
	{	
		this.writeInt8(v & 0xff);
		this.writeInt8(v >> 8 & 0xff);
	}
		
	this.writeInt32 = function(v)
	{
		for(i=0; i<4; i++)
			this.writeInt8(v >> i * 8 & 0xff);
	}

	this.writeInt64 = function(v)
	{
		this.writeInt32(v.lo);
		this.writeInt32(v.hi);
	}
	
	this.writeUint8 = function(v)
	{
		var buf = new Uint8Array(this.buffer, this.wpos, 1);
		buf[0] = v;
		this.wpos += 1;
	}

	this.writeUint16 = function(v)
	{
		this.writeUint8(v & 0xff);
		this.writeUint8(v >> 8 & 0xff);
	}
		
	this.writeUint32 = function(v)
	{
		for(i=0; i<4; i++)
			this.writeUint8(v >> i * 8 & 0xff);
	}

	this.writeUint64 = function(v)
	{
		this.writeUint32(v.lo);
		this.writeUint32(v.hi);
	}
	
	this.writeFloat = function(v)
	{
		try
		{
			var buf = new Float32Array(this.buffer, this.wpos, 1);
			buf[0] = v;
		}
		catch(e)
		{
			var buf = new Float32Array(1);
			buf[0] = v;
			var buf1 = new Uint8Array(this.buffer);
			var buf2 = new Uint8Array(buf.buffer);
			buf1.set(buf2, this.wpos);
		}
		
		this.wpos += 4;
	}

	this.writeDouble = function(v)
	{
		try
		{
			var buf = new Float64Array(this.buffer, this.wpos, 1);
			buf[0] = v;
		}
		catch(e)
		{
			var buf = new Float64Array(1);
			buf[0] = v;
			var buf1 = new Uint8Array(this.buffer);
			var buf2 = new Uint8Array(buf.buffer);
			buf1.set(buf2, this.wpos);
		}

		this.wpos += 8;
	}

	this.writeBlob = function(v)
	{
		size = v.length;
		if(size + 4> this.space())
		{
			KBEngine.ERROR_MSG("memorystream::writeBlob: no free!");
			return;
		}
		
		this.writeUint32(size);
		var buf = new Uint8Array(this.buffer, this.wpos, size);
		
		if(typeof(v) == "string")
		{
			for(i=0; i<size; i++)
			{
				buf[i] = v.charCodeAt(i);
			}
		}
		else
		{
			for(i=0; i<size; i++)
			{
				buf[i] = v[i];
			}
		}
		
		this.wpos += size;
	}
	
	this.writeString = function(v)
	{
		if(v.length > this.space())
		{
			KBEngine.ERROR_MSG("memorystream::writeString: no free!");
			return;
		}
		
		var buf = new Uint8Array(this.buffer, this.wpos);
		var i = 0;
		for(idx=0; idx<v.length; idx++)
		{
			buf[i++] = v.charCodeAt(idx);
		}
		
		buf[i++] = 0;
		this.wpos += i;
	}
	
	//---------------------------------------------------------------------------------
	this.readSkip = function(v)
	{
		this.rpos += v;
	}
	
	//---------------------------------------------------------------------------------
	this.space = function()
	{
		return this.buffer.byteLength - this.wpos;
	}

	//---------------------------------------------------------------------------------
	this.length = function()
	{
		return this.wpos - this.rpos;
	}

	//---------------------------------------------------------------------------------
	this.readEOF = function()
	{
		return this.buffer.byteLength - this.rpos <= 0;
	}

	//---------------------------------------------------------------------------------
	this.done = function()
	{
		this.rpos = this.wpos;
	}
	
	//---------------------------------------------------------------------------------
	this.getbuffer = function(v)
	{
		return this.buffer.slice(this.rpos, this.wpos);
	}
}

/*-----------------------------------------------------------------------------------------
												bundle
-----------------------------------------------------------------------------------------*/
KBEngine.Bundle = function()
{
	this.memorystreams = new Array();
	this.stream = new KBEngine.MemoryStream(KBEngine.PACKET_MAX_SIZE_TCP);
	
	this.numMessage = 0;
	this.messageLengthBuffer = null;
	this.messageLength = 0;
	this.msgtype = null;
	
	//---------------------------------------------------------------------------------
	this.newMessage = function(msgtype)
	{
		this.fini(false);
		
		this.msgtype = msgtype;
		this.numMessage += 1;
		
		if(this.msgtype.length == -1)
		{
			this.messageLengthBuffer = new Uint8Array(this.stream.buffer, this.stream.wpos + KBEngine.MESSAGE_ID_LENGTH, 2);
		}
		
		this.writeUint16(msgtype.id);
		
		if(this.messageLengthBuffer)
		{
			this.writeUint16(0);
			this.messageLengthBuffer[0] = 0;
			this.messageLengthBuffer[1] = 0;
			this.messageLength = 0;
		}
	}

	//---------------------------------------------------------------------------------
	this.writeMsgLength = function(v)
	{
		if(this.messageLengthBuffer)
		{
			this.messageLengthBuffer[0] = v & 0xff;
			this.messageLengthBuffer[1] = v >> 8 & 0xff;
		}
	}
	
	//---------------------------------------------------------------------------------
	this.fini = function(issend)
	{
		if(this.numMessage > 0)
		{
			this.writeMsgLength(this.messageLength);
			if(this.stream)
				this.memorystreams.push(this.stream);
		}
		
		if(issend)
		{
			this.messageLengthBuffer = null;
			this.numMessage = 0;
			this.msgtype = null;
		}
	}
	
	//---------------------------------------------------------------------------------
	this.send = function(network)
	{
		this.fini(true);
		
		for(i=0; i<this.memorystreams.length; i++)
		{
			stream = this.memorystreams[i];
			network.send(stream.getbuffer());
		}
		
		this.memorystreams = new Array();
		this.stream = new KBEngine.MemoryStream(KBEngine.PACKET_MAX_SIZE_TCP);
	}
	
	//---------------------------------------------------------------------------------
	this.checkStream = function(v)
	{
		if(v > this.stream.space())
		{
			this.memorystreams.push(this.stream);
			this.stream = new KBEngine.MemoryStream(KBEngine.PACKET_MAX_SIZE_TCP);
		}

		this.messageLength += v;
	}
	
	//---------------------------------------------------------------------------------
	this.writeInt8 = function(v)
	{
		this.checkStream(1);
		this.stream.writeInt8(v);
	}

	this.writeInt16 = function(v)
	{
		this.checkStream(2);
		this.stream.writeInt16(v);
	}
		
	this.writeInt32 = function(v)
	{
		this.checkStream(4);
		this.stream.writeInt32(v);
	}

	this.writeInt64 = function(v)
	{
		this.checkStream(8);
		this.stream.writeInt64(v);
	}
	
	this.writeUint8 = function(v)
	{
		this.checkStream(1);
		this.stream.writeUint8(v);
	}

	this.writeUint16 = function(v)
	{
		this.checkStream(2);
		this.stream.writeUint16(v);
	}
		
	this.writeUint32 = function(v)
	{
		this.checkStream(4);
		this.stream.writeUint32(v);
	}

	this.writeUint64 = function(v)
	{
		this.checkStream(8);
		this.stream.writeUint64(v);
	}
	
	this.writeFloat = function(v)
	{
		this.checkStream(4);
		this.stream.writeFloat(v);
	}

	this.writeDouble = function(v)
	{
		this.checkStream(8);
		this.stream.writeDouble(v);
	}
	
	this.writeString = function(v)
	{
		this.checkStream(v.length + 1);
		this.stream.writeString(v);
	}
	
	this.writeBlob = function(v)
	{
		this.checkStream(v.length + 4);
		this.stream.writeBlob(v);
	}
}

/*-----------------------------------------------------------------------------------------
												messages
-----------------------------------------------------------------------------------------*/
KBEngine.reader = new KBEngine.MemoryStream(0);
KBEngine.datatype2id = {};
KBEngine.datatype2id["STRING"] = 1;
KBEngine.datatype2id["STD::STRING"] = 1;

KBEngine.datatype2id["UINT8"] = 2;
KBEngine.datatype2id["BOOL"] = 2;
KBEngine.datatype2id["DATATYPE"] = 2;
KBEngine.datatype2id["CHAR"] = 2;
KBEngine.datatype2id["DETAIL_TYPE"] = 2;
KBEngine.datatype2id["MAIL_TYPE"] = 2;

KBEngine.datatype2id["UINT16"] = 3;
KBEngine.datatype2id["UNSIGNED SHORT"] = 3;
KBEngine.datatype2id["SERVER_ERROR_CODE"] = 3;
KBEngine.datatype2id["ENTITY_TYPE"] = 3;
KBEngine.datatype2id["ENTITY_PROPERTY_UID"] = 3;
KBEngine.datatype2id["ENTITY_METHOD_UID"] = 3;
KBEngine.datatype2id["ENTITY_SCRIPT_UID"] = 3;
KBEngine.datatype2id["DATATYPE_UID"] = 3;

KBEngine.datatype2id["UINT32"] = 4;
KBEngine.datatype2id["UINT"] = 4;
KBEngine.datatype2id["UNSIGNED INT"] = 4;
KBEngine.datatype2id["ARRAYSIZE"] = 4;
KBEngine.datatype2id["SPACE_ID"] = 4;
KBEngine.datatype2id["GAME_TIME"] = 4;
KBEngine.datatype2id["TIMER_ID"] = 4;

KBEngine.datatype2id["UINT64"] = 5;
KBEngine.datatype2id["DBID"] = 5;
KBEngine.datatype2id["COMPONENT_ID"] = 5;

KBEngine.datatype2id["INT8"] = 6;
KBEngine.datatype2id["COMPONENT_ORDER"] = 6;

KBEngine.datatype2id["INT16"] = 7;
KBEngine.datatype2id["SHORT"] = 7;

KBEngine.datatype2id["INT32"] = 8;
KBEngine.datatype2id["INT"] = 8;
KBEngine.datatype2id["ENTITY_ID"] = 8;
KBEngine.datatype2id["CALLBACK_ID"] = 8;
KBEngine.datatype2id["COMPONENT_TYPE"] = 8;

KBEngine.datatype2id["INT64"] = 9;

KBEngine.datatype2id["PYTHON"] = 10;
KBEngine.datatype2id["PY_DICT"] = 10;
KBEngine.datatype2id["PY_TUPLE"] = 10;
KBEngine.datatype2id["PY_LIST"] = 10;
KBEngine.datatype2id["MAILBOX"] = 10;

KBEngine.datatype2id["BLOB"] = 11;

KBEngine.datatype2id["UNICODE"] = 12;

KBEngine.datatype2id["FLOAT"] = 13;

KBEngine.datatype2id["DOUBLE"] = 14;

KBEngine.datatype2id["VECTOR2"] = 15;

KBEngine.datatype2id["VECTOR3"] = 16;

KBEngine.datatype2id["VECTOR4"] = 17;

KBEngine.datatype2id["FIXED_DICT"] = 18;

KBEngine.datatype2id["ARRAY"] = 19;


KBEngine.bindwriter = function(writer, argType)
{
	if(argType == KBEngine.datatype2id["UINT8"])
	{
		return writer.writeUint8;
	}
	else if(argType == KBEngine.datatype2id["UINT16"])
	{
		return writer.writeUint16;
	}
	else if(argType == KBEngine.datatype2id["UINT32"])
	{
		return writer.writeUint32;
	}
	else if(argType == KBEngine.datatype2id["UINT64"])
	{
		return writer.writeUint64;
	}
	else if(argType == KBEngine.datatype2id["INT8"])
	{
		return writer.writeInt8;
	}
	else if(argType == KBEngine.datatype2id["INT16"])
	{
		return writer.writeInt16;
	}
	else if(argType == KBEngine.datatype2id["INT32"])
	{
		return writer.writeInt32;
	}
	else if(argType == KBEngine.datatype2id["INT64"])
	{
		return writer.writeInt64;
	}
	else if(argType == KBEngine.datatype2id["FLOAT"])
	{
		return writer.writeFloat;
	}
	else if(argType == KBEngine.datatype2id["DOUBLE"])
	{
		return writer.writeDouble;
	}
	else if(argType == KBEngine.datatype2id["STRING"])
	{
		return writer.writeString;
	}
	else if(argType == KBEngine.datatype2id["FIXED_DICT"])
	{
		return writer.writeStream;
	}
	else if(argType == KBEngine.datatype2id["ARRAY"])
	{
		return writer.writeStream;
	}
	else
	{
		return writer.writeStream;
	}
}

KBEngine.bindReader = function(argType)
{
	if(argType == KBEngine.datatype2id["UINT8"])
	{
		return KBEngine.reader.readUint8;
	}
	else if(argType == KBEngine.datatype2id["UINT16"])
	{
		return KBEngine.reader.readUint16;
	}
	else if(argType == KBEngine.datatype2id["UINT32"])
	{
		return KBEngine.reader.readUint32;
	}
	else if(argType == KBEngine.datatype2id["UINT64"])
	{
		return KBEngine.reader.readUint64;
	}
	else if(argType == KBEngine.datatype2id["INT8"])
	{
		return KBEngine.reader.readInt8;
	}
	else if(argType == KBEngine.datatype2id["INT16"])
	{
		return KBEngine.reader.readInt16;
	}
	else if(argType == KBEngine.datatype2id["INT32"])
	{
		return KBEngine.reader.readInt32;
	}
	else if(argType == KBEngine.datatype2id["INT64"])
	{
		return KBEngine.reader.readInt64;
	}
	else if(argType == KBEngine.datatype2id["FLOAT"])
	{
		return KBEngine.reader.readFloat;
	}
	else if(argType == KBEngine.datatype2id["DOUBLE"])
	{
		return KBEngine.reader.readDouble;
	}
	else if(argType == KBEngine.datatype2id["STRING"])
	{
		return KBEngine.reader.readString;
	}
	else if(argType == KBEngine.datatype2id["PYTHON"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["VECTOR2"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["VECTOR3"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["VECTOR4"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["BLOB"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["UNICODE"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["FIXED_DICT"])
	{
		return KBEngine.reader.readStream;
	}
	else if(argType == KBEngine.datatype2id["ARRAY"])
	{
		return KBEngine.reader.readStream;
	}
	else
	{
		return KBEngine.reader.readStream;
	}
}
	
KBEngine.Message = function(id, name, length, argstype, args, handler)
{
	this.id = id;
	this.name = name;
	this.length = length;
	this.argsType = argstype;
	
	// 绑定执行
	for(i=0; i<args.length; i++)
	{
		args[i] = KBEngine.bindReader(args[i]);
	}
	
	this.args = args;
	this.handler = handler;
	
	this.createFromStream = function(msgstream)
	{
		if(this.args.length <= 0)
			return msgstream;
		
		var result = new Array(this.args.length);
		for(i=0; i<this.args.length; i++)
		{
			result[i] = this.args[i].call(msgstream);
		}
		
		return result;
	}
	
	this.handleMessage = function(msgstream)
	{
		if(this.handler == null)
		{
			KBEngine.ERROR_MSG("KBEngine.Message::handleMessage: interface(" + this.name + "/" + this.id + ") no implement!");  
			return;
		}

		if(this.args.length <= 0)
		{
			if(this.argsType < 0)
				this.handler(msgstream);
			else
				this.handler();
		}
		else
		{
			this.handler.apply(KBEngine.app, this.createFromStream(msgstream));
		}
	}
}

// 上行消息
KBEngine.messages = {};
KBEngine.messages["loginapp"] = {};
KBEngine.messages["baseapp"] = {};
KBEngine.clientmessages = {};

KBEngine.messages["Loginapp_importClientMessages"] = new KBEngine.Message(5, "importClientMessages", 0, 0, new Array(), null);
KBEngine.messages["Baseapp_importClientMessages"] = new KBEngine.Message(207, "importClientMessages", 0, 0, new Array(), null);
KBEngine.messages["Baseapp_importClientEntityDef"] = new KBEngine.Message(208, "importClientEntityDef", 0, 0, new Array(), null);
KBEngine.messages["onImportClientMessages"] = new KBEngine.Message(518, "onImportClientMessages", -1, -1, new Array(), null);

KBEngine.bufferedCreateEntityMessage = {};

/*-----------------------------------------------------------------------------------------
												math
-----------------------------------------------------------------------------------------*/
KBEngine.Vector3 = KBEngine.Class.extend(
{
    ctor:function (x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
        return true;
    },

    distance : function(pos)
    {
    	var x = pos.x - this.x;
    	var y = pos.y - this.y;
    	var z = pos.z - this.z;
    	return Math.sqrt(x * x + y * y + z * z);
    }
});

KBEngine.clampf = function (value, min_inclusive, max_inclusive) 
{
    if (min_inclusive > max_inclusive) {
        var temp = min_inclusive;
        min_inclusive = max_inclusive;
        max_inclusive = temp;
    }
    return value < min_inclusive ? min_inclusive : value < max_inclusive ? value : max_inclusive;
};

KBEngine.int82angle = function(angle/*int8*/, half/*bool*/)
{
	return angle * (Math.PI / (half ? 254.0 : 128.0));
};

KBEngine.angle2int8 = function(v/*float*/, half/*bool*/)
{
	var angle = 0;
	if(!half)
	{
		angle = Math.floor((v * 128.0) / float(Math.PI) + 0.5);
	}
	else
	{
		angle = KBEngine.clampf(floorf( (v * 254.0) / float(Math.PI) + 0.5), -128.0, 127.0);
	}

	return angle;
};

/*-----------------------------------------------------------------------------------------
												entity
-----------------------------------------------------------------------------------------*/
KBEngine.Entity = KBEngine.Class.extend(
{
    ctor:function () {
		this.id = 0;
		this.className = "";
		this.position = new KBEngine.Vector3(0.0, 0.0, 0.0);
		this.direction = new KBEngine.Vector3(0.0, 0.0, 0.0);
		this.velocity = 0.0
			
		this.cell = null;
		this.base = null;
		
		this.inWorld = false;		
        return true;
    },
    
    // 与服务端实体脚本中__init__类似, 代表初始化实体
	__init__ : function()
	{
	},

	onDestroy : function()
	{
	},

	isPlayer : function()
	{
		return this.id == KBEngine.app.entity_id;
	},

	baseCall : function()
	{
		if(arguments.length < 1)
		{
			KBEngine.ERROR_MSG('KBEngine.Entity::baseCall: not fount interfaceName!');  
			return;
		}

		if(this.base == undefined)
		{
			KBEngine.ERROR_MSG('KBEngine.Entity::cellCall: cell is None!');  
			return;			
		}
		
		var method = KBEngine.moduledefs[this.className].base_methods[arguments[0]];
		var methodID = method[0];
		var args = method[3];
		
		if(arguments.length - 1 != args.length)
		{
			KBEngine.ERROR_MSG("KBEngine.Entity::baseCall: args(" + (arguments.length - 1) + "!= " + args.length + ") size is error!");  
			return;
		}
		
		this.base.newMail();
		this.base.bundle.writeUint16(methodID);
		
		try
		{
			for(var i=0; i<args.length; i++)
			{
				if(args[i].isSameType(arguments[i + 1]))
				{
					args[i].addToStream(this.base.bundle, arguments[i + 1]);
				}
				else
				{
					throw new Error("KBEngine.Entity::baseCall: arg[" + i + "] is error!");
				}
			}
		}
		catch(e)
		{
			KBEngine.ERROR_MSG(e.toString());
			KBEngine.ERROR_MSG('KBEngine.Entity::baseCall: args is error!');
			this.base.bundle = null;
			return;
		}
		
		this.base.postMail();
	},
	
	cellCall : function()
	{
		if(arguments.length < 1)
		{
			KBEngine.ERROR_MSG('KBEngine.Entity::cellCall: not fount interfaceName!');  
			return;
		}
		
		if(this.cell == undefined)
		{
			KBEngine.ERROR_MSG('KBEngine.Entity::cellCall: cell is None!');  
			return;			
		}
		
		var method = KBEngine.moduledefs[this.className].cell_methods[arguments[0]];
		var methodID = method[0];
		var args = method[3];
		
		if(arguments.length - 1 != args.length)
		{
			KBEngine.ERROR_MSG("KBEngine.Entity::cellCall: args(" + (arguments.length - 1) + "!= " + args.length + ") size is error!");  
			return;
		}
		
		this.cell.newMail();
		this.cell.bundle.writeUint16(methodID);
		
		try
		{
			for(var i=0; i<args.length; i++)
			{
				if(args[i].isSameType(arguments[i + 1]))
				{
					args[i].addToStream(this.cell.bundle, arguments[i + 1]);
				}
				else
				{
					throw new Error("KBEngine.Entity::cellCall: arg[" + i + "] is error!");
				}
			}
		}
		catch(e)
		{
			KBEngine.ERROR_MSG(e.toString());
			KBEngine.ERROR_MSG('KBEngine.Entity::cellCall: args is error!');
			this.cell.bundle = null;
			return;
		}
		
		this.cell.postMail();
	},
	
	onEnterWorld : function()
	{
		KBEngine.INFO_MSG(this.className + '::onEnterWorld: ' + this.id); 
		this.inWorld = true;
		
		KBEngine.Event.fire("onEnterWorld", this);
	},
	
	onLeaveWorld : function()
	{
		KBEngine.INFO_MSG(this.className + '::onLeaveWorld: ' + this.id); 
		this.inWorld = false;
		
		KBEngine.Event.fire("onLeaveWorld", this);
	},
	
	onEnterSpace : function()
	{
		KBEngine.INFO_MSG(this.className + '::onEnterSpace: ' + this.id); 
		KBEngine.Event.fire("onEnterSpace", this);
	},
	
	onLeaveSpace : function()
	{
		KBEngine.INFO_MSG(this.className + '::onLeaveSpace: ' + this.id); 
		KBEngine.Event.fire("onLeaveSpace", this);
	},

	set_position : function(old)
	{
		// Dbg.DEBUG_MSG(className + "::set_position: " + old + " => " + v); 
		
		if(this.isPlayer())
		{
			KBEngine.app.entityServerPos.x = this.position.x;
			KBEngine.app.entityServerPos.y = this.position.y;
			KBEngine.app.entityServerPos.z = this.position.z;
		}
		
		KBEngine.Event.fire("set_position", this);
	},

	onUpdateVolatileData : function()
	{
	},
	
	set_direction : function(old)
	{
		// Dbg.DEBUG_MSG(className + "::set_direction: " + old + " => " + v); 
		KBEngine.Event.fire("set_direction", this);
	}
});

/*-----------------------------------------------------------------------------------------
												mailbox
-----------------------------------------------------------------------------------------*/
KBEngine.MAILBOX_TYPE_CELL = 0;
KBEngine.MAILBOX_TYPE_BASE = 1;

KBEngine.Mailbox = function()
{
	this.id = 0;
	this.className = "";
	this.type = KBEngine.MAILBOX_TYPE_CELL;
	this.networkInterface = KBEngine.app;
	
	this.bundle = null;
	
	this.isBase = function()
	{
		return this.type == KBEngine.MAILBOX_TYPE_BASE;
	}

	this.isCell = function()
	{
		return this.type == KBEngine.MAILBOX_TYPE_CELL;
	}
	
	this.newMail = function()
	{  
		if(this.bundle == null)
			this.bundle = new KBEngine.Bundle();
		
		if(this.type == KBEngine.MAILBOX_TYPE_CELL)
			this.bundle.newMessage(KBEngine.messages.Baseapp_onRemoteCallCellMethodFromClient);
		else
			this.bundle.newMessage(KBEngine.messages.Base_onRemoteMethodCall);

		this.bundle.writeInt32(this.id);
		
		return this.bundle;
	}
	
	this.postMail = function(bundle)
	{
		if(bundle == undefined)
			bundle = this.bundle;
		
		bundle.send(this.networkInterface);
		
		if(this.bundle == bundle)
			this.bundle = null;
	}
}

/*-----------------------------------------------------------------------------------------
												entitydef
-----------------------------------------------------------------------------------------*/
KBEngine.moduledefs = {};
KBEngine.datatypes = {};

KBEngine.DATATYPE_UINT8 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readUint8.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint8(v);
	}

	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < 0 || v > 0xff)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_UINT16 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readUint16.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint16(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < 0 || v > 0xffff)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_UINT32 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readUint32.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint32(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < 0 || v > 0xffffffff)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_UINT64 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readUint64.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint64(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return v instanceof KBEngine.UINT64;
	}
}

KBEngine.DATATYPE_INT8 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readInt8.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeInt8(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < -0x80 || v > 0x7f)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_INT16 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readInt16.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeInt16(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < -0x8000 || v > 0x7fff)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_INT32 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readInt32.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeInt32(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(typeof(v) != "number")
		{
			return false;
		}
		
		if(v < -0x80000000 || v > 0x7fffffff)
		{
			return false;
		}
		
		return true;
	}
}

KBEngine.DATATYPE_INT64 = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readInt64.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeInt64(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return v instanceof KBEngine.INT64;
	}
}

KBEngine.DATATYPE_FLOAT = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readFloat.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeFloat(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return typeof(v) == "number";
	}
}

KBEngine.DATATYPE_DOUBLE = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readDouble.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeDouble(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return typeof(v) == "number";
	}
}

KBEngine.DATATYPE_STRING = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		return KBEngine.reader.readString.call(stream);
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeString(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return typeof(v) == "string";
	}
}

KBEngine.DATATYPE_VECTOR = function(size)
{
	this.itemsize = size;
	
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		
		var size = KBEngine.reader.readUint32.call(stream);
		if(size != this.itemsize)
		{
			KBEngine.ERROR_MSG("KBEDATATYPE_VECTOR::createFromStream: size(" + size + ") != thisSize(" + this.itemsize + ") !");
			return undefined;
		}
		
		if(this.itemsize == 3)
		{
			if(KBEngine.CLIENT_NO_FLOAT)
			{
				return new KBEngine.Vector3(KBEngine.reader.readInt32.call(stream), 
					KBEngine.reader.readInt32.call(stream), KBEngine.reader.readInt32.call(stream));
			}
			else
			{
				return new KBEngine.Vector3(KBEngine.reader.readFloat.call(stream), 
					KBEngine.reader.readFloat.call(stream), KBEngine.reader.readFloat.call(stream));
			}
		}
		else if(this.itemsize == 4)
		{
			if(KBEngine.CLIENT_NO_FLOAT)
			{
				return new KBEngine.Vector4(KBEngine.reader.readInt32.call(stream), 
					KBEngine.reader.readInt32.call(stream), KBEngine.reader.readInt32.call(stream));
			}
			else
			{
				return new KBEngine.Vector4(KBEngine.reader.readFloat.call(stream), 
					KBEngine.reader.readFloat.call(stream), KBEngine.reader.readFloat.call(stream));
			}
		}
		else if(this.itemsize == 2)
		{
			if(KBEngine.CLIENT_NO_FLOAT)
			{
				return new KBEngine.Vector2(KBEngine.reader.readInt32.call(stream), 
					KBEngine.reader.readInt32.call(stream), KBEngine.reader.readInt32.call(stream));
			}
			else
			{
				return new KBEngine.Vector2(KBEngine.reader.readFloat.call(stream), 
					KBEngine.reader.readFloat.call(stream), KBEngine.reader.readFloat.call(stream));
			}
		}
		
		return undefined;
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint32(this.itemsize);
		
		if(KBEngine.CLIENT_NO_FLOAT)
		{
			stream.writeInt32(v.x);
			stream.writeInt32(v.y);
		}
		else
		{
			stream.writeFloat(v.x);
			stream.writeFloat(v.y);			
		}
		
		if(this.itemsize == 3)
		{
			if(KBEngine.CLIENT_NO_FLOAT)
			{
				stream.writeInt32(v.z);
			}
			else
			{
				stream.writeFloat(v.z);
			}
		}
		else if(this.itemsize == 4)
		{
			if(KBEngine.CLIENT_NO_FLOAT)
			{
				stream.writeInt32(v.z);
				stream.writeInt32(v.w);
			}
			else
			{
				stream.writeFloat(v.z);
				stream.writeFloat(v.w);			
			}
		}
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		if(this.itemsize == 2)
		{
			if(! v instanceof KBEngine.Vector2)
			{
				return false;
			}
		}
		else if(this.itemsize == 3)
		{
			if(! v instanceof KBEngine.Vector3)
			{
				return false;
			}
		}
		else if(this.itemsize == 4)
		{
			if(! v instanceof KBEngine.Vector4)
			{
				return false;
			}
		}
		
		return true;
	}
}

KBEngine.DATATYPE_PYTHON = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
	}
	
	this.addToStream = function(stream, v)
	{
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return false;
	}
}

KBEngine.DATATYPE_UNICODE = function()
{
	this.bind = function()
	{
	}

	this.createFromStream = function(stream)
	{
		return KBEngine.utf8ArrayToString(KBEngine.reader.readBlob.call(stream));
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeBlob(KBEngine.stringToUTF8Bytes(v));
	}
	
	this.parseDefaultValStr = function(v)
	{
		if(typeof(v) == "string")
			return v;
		
		return "";
	}
	
	this.isSameType = function(v)
	{
		return typeof(v) == "string";
	}
}

KBEngine.DATATYPE_MAILBOX = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
	}
	
	this.addToStream = function(stream, v)
	{
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return false;
	}
}

KBEngine.DATATYPE_BLOB = function()
{
	this.bind = function()
	{
	}
	
	this.createFromStream = function(stream)
	{
		var size = KBEngine.reader.readUint32.call(stream);
		var buf = new Uint8Array(stream.buffer, stream.rpos, size);
		stream.rpos += size;
		return buf;
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeBlob(v);
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		return true;
	}
}

KBEngine.DATATYPE_ARRAY = function()
{
	this.type = null;
	
	this.bind = function()
	{
		if(typeof(this.type) == "number")
			this.type = KBEngine.datatypes[this.type];
	}
	
	this.createFromStream = function(stream)
	{
		var size = stream.readUint32();
		var datas = [];
		
		while(size > 0)
		{
			size--;
			datas.push(this.type.createFromStream(stream));
		};
		
		return datas;
	}
	
	this.addToStream = function(stream, v)
	{
		stream.writeUint32(v.length);
		for(var i=0; i<v.length; i++)
		{
			this.type.addToStream(stream, v[i]);
		}
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		for(var i=0; i<v.length; i++)
		{
			if(!this.type.isSameType(v[i]))
			{
				return false;
			}
		}
		
		return true;
	}
}

KBEngine.DATATYPE_FIXED_DICT = function()
{
	this.dicttype = {};
	this.implementedBy = null;
	
	this.bind = function()
	{
		for(itemkey in this.dicttype)
		{
			var utype = this.dicttype[itemkey];
			
			if(typeof(this.dicttype[itemkey]) == "number")
				this.dicttype[itemkey] = KBEngine.datatypes[utype];
		}
	}
	
	this.createFromStream = function(stream)
	{
		var datas = {};
		for(itemkey in this.dicttype)
		{
			datas[itemkey] = this.dicttype[itemkey].createFromStream(stream);
		}
		
		return datas;
	}
	
	this.addToStream = function(stream, v)
	{
		for(itemkey in this.dicttype)
		{
			this.dicttype[itemkey].addToStream(stream, v[itemkey]);
		}
	}
	
	this.parseDefaultValStr = function(v)
	{
		return eval(v);
	}
	
	this.isSameType = function(v)
	{
		for(itemkey in this.dicttype)
		{
			if(!this.dicttype[itemkey].isSameType(v[itemkey]))
			{
				return false;
			}
		}
		
		return true;
	}
}

KBEngine.datatypes["UINT8"]		= new KBEngine.DATATYPE_UINT8();
KBEngine.datatypes["UINT16"]	= new KBEngine.DATATYPE_UINT16();
KBEngine.datatypes["UINT32"]	= new KBEngine.DATATYPE_UINT32();
KBEngine.datatypes["UINT64"]	= new KBEngine.DATATYPE_UINT64();

KBEngine.datatypes["INT8"]		= new KBEngine.DATATYPE_INT8();
KBEngine.datatypes["INT16"]		= new KBEngine.DATATYPE_INT16();
KBEngine.datatypes["INT32"]		= new KBEngine.DATATYPE_INT32();
KBEngine.datatypes["INT64"]		= new KBEngine.DATATYPE_INT64();

KBEngine.datatypes["FLOAT"]		= new KBEngine.DATATYPE_FLOAT();
KBEngine.datatypes["DOUBLE"]	= new KBEngine.DATATYPE_DOUBLE();

KBEngine.datatypes["STRING"]	= new KBEngine.DATATYPE_STRING();
KBEngine.datatypes["VECTOR2"]	= new KBEngine.DATATYPE_VECTOR(2);
KBEngine.datatypes["VECTOR3"]	= new KBEngine.DATATYPE_VECTOR(3);
KBEngine.datatypes["VECTOR4"]	= new KBEngine.DATATYPE_VECTOR(4);
KBEngine.datatypes["PYTHON"]	= new KBEngine.DATATYPE_PYTHON();
KBEngine.datatypes["UNICODE"]	= new KBEngine.DATATYPE_UNICODE();
KBEngine.datatypes["MAILBOX"]	= new KBEngine.DATATYPE_MAILBOX();
KBEngine.datatypes["BLOB"]		= new KBEngine.DATATYPE_BLOB();

/*-----------------------------------------------------------------------------------------
												KBEngine args
-----------------------------------------------------------------------------------------*/
KBEngine.KBEngineArgs = function()
{
	this.ip = "127.0.0.1";
	this.port = 20013;
	this.updateHZ = 100;
	
	// Reference: http://www.kbengine.org/docs/programming/clientsdkprogramming.html, client types
	this.clientType = 3;
}

/*-----------------------------------------------------------------------------------------
												KBEngine app
-----------------------------------------------------------------------------------------*/
KBEngine.KBEngineApp = function(kbengineArgs)
{
	console.assert(KBEngine.app == null || KBEngine.app == undefined, "Assertion of KBEngine.app not is null");
	
	KBEngine.app = this;
	
	this.args = kbengineArgs;
	
	this.username = "testhtml51";
	this.password = "123456";
	this.clientdatas = "";
	this.encryptedKey = "";
	
	this.loginappMessageImported = false;
	this.baseappMessageImported = false;
	this.serverErrorsDescrImported = false;
	this.entitydefImported = false;
	
	
	// 描述服务端返回的错误信息
	KBEngine.ServerErr = function()
	{
		this.name = "";
		this.descr = "";
		this.id = 0;
	}
	
	this.serverErrs = {};
		
	// 登录loginapp的地址
	this.ip = this.args.ip;
	this.port = this.args.port;
	
	// 服务端分配的baseapp地址
	this.baseappIP = "";
	this.baseappPort = 0;
			
	this.reset = function()
	{
		if(this.entities != undefined && this.entities != null)
		{
			this.clearEntities(true);
		}
		
		if(this.socket != undefined && this.socket != null)
		{
			this.socket.onclose = undefined;
			this.socket.close();
			this.socket = null;
		}
		
		this.currserver = "loginapp";
		this.currstate = "create";
		
		// 扩展数据
		this.serverdatas = "";
		
		// 版本信息
		this.serverVersion = "";
		this.serverScriptVersion = "";
		this.serverProtocolMD5 = "";
		this.serverEntityDefMD5 = "";
		this.clientVersion = "0.6.15";
		this.clientScriptVersion = "0.1.0";
		
		// player的相关信息
		this.entity_uuid = null;
		this.entity_id = 0;
		this.entity_type = "";

		// 当前玩家最后一次同步到服务端的位置与朝向与服务端最后一次同步过来的位置
		this.entityLastLocalPos = new KBEngine.Vector3(0.0, 0.0, 0.0);
		this.entityLastLocalDir = new KBEngine.Vector3(0.0, 0.0, 0.0);
		this.entityServerPos = new KBEngine.Vector3(0.0, 0.0, 0.0);
		
		// 玩家是否在地面上
		this.isOnGound = false;
		
		// 客户端所有的实体
		this.entities = {};
		this.entityIDAliasIDList = [];
		
		// 空间的信息
		this.spacedata = {};
		this.spaceID = 0;
		this.spaceResPath = "";
		this.isLoadedGeometry = false;
		
		var dateObject = new Date();
		this.lastticktime = dateObject.getTime();

		// 当前组件类别， 配套服务端体系
		this.component = "client";
	}

	this.installEvents = function()
	{
		KBEngine.Event.register("createAccount", this, "createAccount");
		KBEngine.Event.register("login", this, "login");
		KBEngine.Event.register("relogin_baseapp", this, "relogin_baseapp");
	}

	this.uninstallEvents = function()
	{
		KBEngine.Event.deregister("relogin_baseapp", this);
		KBEngine.Event.deregister("login", this);
		KBEngine.Event.deregister("createAccount", this);
	}
	
	this.hello = function()
	{  
		var bundle = new KBEngine.Bundle();
		
		if(KBEngine.app.currserver == "loginapp")
			bundle.newMessage(KBEngine.messages.Loginapp_hello);
		else
			bundle.newMessage(KBEngine.messages.Baseapp_hello);
		
		bundle.writeString(KBEngine.app.clientVersion);
		bundle.writeString(KBEngine.app.clientScriptVersion);
		bundle.writeBlob(KBEngine.app.encryptedKey);
		bundle.send(KBEngine.app);
	}

	this.player = function()
	{
		return KBEngine.app.entities[KBEngine.app.entity_id];
	}

	this.findEntity = function(entityID)
	{
		return KBEngine.app.entities[entityID];
	}
		
	this.connect = function(addr)
	{
		console.assert(KBEngine.app.socket == null, "Assertion of socket not is null");
		
		try
		{  
			KBEngine.app.socket = new WebSocket(addr);  
		}
		catch(e)
		{  
			KBEngine.ERROR_MSG('WebSocket init error!');  
			KBEngine.Event.fire("onConnectStatus", false);
			return;  
		}
		
		KBEngine.app.socket.binaryType = "arraybuffer";
		KBEngine.app.socket.onopen = KBEngine.app.onopen;  
		KBEngine.app.socket.onerror = KBEngine.app.onerror_before_onopen;  
		KBEngine.app.socket.onmessage = KBEngine.app.onmessage;  
		KBEngine.app.socket.onclose = KBEngine.app.onclose;
	}

	this.disconnect = function()
	{
		try
		{  
			if(KBEngine.app.socket != null)
			{
				KBEngine.app.socket.onclose = undefined;
				KBEngine.app.socket.close();
				KBEngine.app.socket = null;
			}
		}
		catch(e)
		{ 
		}
	}
	
	this.onopen = function()
	{  
		KBEngine.INFO_MSG('connect success!');
		KBEngine.app.socket.onerror = KBEngine.app.onerror_after_onopen;
		KBEngine.Event.fire("onConnectStatus", true);
	}

	this.onerror_before_onopen = function(evt)
	{  
		KBEngine.ERROR_MSG('connect error:' + evt.data);
		KBEngine.Event.fire("onConnectStatus", false);
	}
	
	this.onerror_after_onopen = function(evt)
	{
		KBEngine.ERROR_MSG('connect error:' + evt.data);
		KBEngine.Event.fire("onDisableConnect");
	}
	
	this.onmessage = function(msg)
	{ 
		var stream = new KBEngine.MemoryStream(msg.data);
		stream.wpos = msg.data.byteLength;
		
		while(stream.rpos < stream.wpos)
		{
			var msgid = stream.readUint16();
			var msgHandler = KBEngine.clientmessages[msgid];
			
			if(!msgHandler)
			{
				KBEngine.ERROR_MSG("KBEngineApp::onmessage[" + KBEngine.app.currserver + "]: not found msg(" + msgid + ")!");
			}
			else
			{
				var msglen = msgHandler.length;
				if(msglen == -1)
				{
					msglen = stream.readUint16();
					
					// 扩展长度
					if(msglen == 65535)
						msglen = stream.readUint32();
				}
			
				var wpos = stream.wpos;
				var rpos = stream.rpos + msglen;
				stream.wpos = rpos;
				msgHandler.handleMessage(stream);
				stream.wpos = wpos;
				stream.rpos = rpos;
			}
		}
	}  

	this.onclose = function()
	{  
		KBEngine.INFO_MSG('connect close:' + KBEngine.app.currserver);
		KBEngine.Event.fire("onDisableConnect");
		//if(KBEngine.app.currserver != "loginapp")
		//	KBEngine.app.reset();
	}

	this.send = function(msg)
	{
		KBEngine.app.socket.send(msg);
	}

	this.close = function(){  
		KBEngine.app.socket.close();  
		KBEngine.app.reset();
	}
	
	this.update = function()
	{
		if(KBEngine.app.socket == null)
			return;

		var dateObject = new Date();
		if((dateObject.getTime() - KBEngine.app.lastticktime) / 1000 > 15)
		{
			if(KBEngine.app.currserver == "loginapp")
			{
				if(KBEngine.messages.Loginapp_onClientActiveTick != undefined)
				{
					var bundle = new KBEngine.Bundle();
					bundle.newMessage(KBEngine.messages.Loginapp_onClientActiveTick);
					bundle.send(KBEngine.app);
				}
			}
			else
			{
				if(KBEngine.messages.Baseapp_onClientActiveTick != undefined)
				{
					var bundle = new KBEngine.Bundle();
					bundle.newMessage(KBEngine.messages.Baseapp_onClientActiveTick);
					bundle.send(KBEngine.app);
				}
			}
			
			KBEngine.app.lastticktime = dateObject.getTime();
		}
		
		KBEngine.app.updatePlayerToServer();
	}

	/*
		通过错误id得到错误描述
	*/
	this.serverErr = function(id)
	{
		var e = KBEngine.app.serverErrs[id];
		
		if(e == undefined)
		{
			return "";
		}

		return e.name + " [" + e.descr + "]";
	}

	/*
		服务端错误描述导入了
	*/
	this.Client_onImportServerErrorsDescr = function(stream)
	{
		var size = stream.readUint16();
		while(size > 0)
		{
			size -= 1;
			
			var e = new KBEngine.ServerErr();
			e.id = stream.readUint16();
			e.name = KBEngine.utf8ArrayToString(stream.readBlob());
			e.descr = KBEngine.utf8ArrayToString(stream.readBlob());
			
			KBEngine.app.serverErrs[e.id] = e;
				
			KBEngine.INFO_MSG("Client_onImportServerErrorsDescr: id=" + e.id + ", name=" + e.name + ", descr=" + e.descr);
		}
	}
		
	this.onOpenLoginapp_login = function()
	{  
		KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_login: successfully!");
		KBEngine.Event.fire("onConnectStatus", true);
		
		KBEngine.app.currserver = "loginapp";
		KBEngine.app.currstate = "login";
		
		if(!KBEngine.app.loginappMessageImported)
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_importClientMessages);
			bundle.send(KBEngine.app);
			KBEngine.app.socket.onmessage = KBEngine.app.Client_onImportClientMessages;  
			KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_login: start importClientMessages ...");
			KBEngine.Event.fire("Loginapp_importClientMessages");
		}
		else
		{
			KBEngine.app.onImportClientMessagesCompleted();
		}
	}
	
	this.onOpenLoginapp_createAccount = function()
	{  
		KBEngine.Event.fire("onConnectStatus", true);
		KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_createAccount: successfully!");
		KBEngine.app.currserver = "loginapp";
		KBEngine.app.currstate = "createAccount";
		
		if(!KBEngine.app.loginappMessageImported)
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_importClientMessages);
			bundle.send(KBEngine.app);
			KBEngine.app.socket.onmessage = KBEngine.app.Client_onImportClientMessages;  
			KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_createAccount: start importClientMessages ...");
			KBEngine.Event.fire("Loginapp_importClientMessages");
		}
		else
		{
			KBEngine.app.onImportClientMessagesCompleted();
		}
	}
	
	this.onImportClientMessagesCompleted = function()
	{
		KBEngine.INFO_MSG("KBEngineApp::onImportClientMessagesCompleted: successfully!");
		KBEngine.app.socket.onmessage = KBEngine.app.onmessage; 
		KBEngine.app.hello();
		
		if(KBEngine.app.currserver == "loginapp")
		{
			if(!KBEngine.app.serverErrorsDescrImported)
			{
				KBEngine.INFO_MSG("KBEngine::onImportClientMessagesCompleted(): send importServerErrorsDescr!");
				KBEngine.app.serverErrorsDescrImported = true;
				var bundle = new KBEngine.Bundle();
				bundle.newMessage(KBEngine.messages.Loginapp_importServerErrorsDescr);
				bundle.send(KBEngine.app);
			}
							
			if(KBEngine.app.currstate == "login")
				KBEngine.app.login_loginapp(false);
			else if(KBEngine.app.currstate == "resetpassword")
				KBEngine.app.resetpassword_loginapp(false);
			else
				KBEngine.app.createAccount_loginapp(false);
			
			KBEngine.app.loginappMessageImported = true;
		}
		else
		{
			KBEngine.app.baseappMessageImported = true;
			
			if(!KBEngine.app.entitydefImported)
			{
				KBEngine.INFO_MSG("KBEngineApp::onImportClientMessagesCompleted: start importEntityDef ...");
				var bundle = new KBEngine.Bundle();
				bundle.newMessage(KBEngine.messages.Baseapp_importClientEntityDef);
				bundle.send(KBEngine.app);
				KBEngine.Event.fire("Baseapp_importClientEntityDef");
			}
			else
			{
				KBEngine.app.onImportEntityDefCompleted();
			}
		}
	}

	this.createDataTypeFromStreams = function(stream, canprint)
	{
		var aliassize = stream.readUint16();
		KBEngine.INFO_MSG("KBEngineApp::createDataTypeFromStreams: importAlias(size=" + aliassize + ")!");
		
		while(aliassize > 0)
		{
			aliassize--;
			KBEngine.app.createDataTypeFromStream(stream, canprint);
		};		
	}
	
	this.createDataTypeFromStream = function(stream, canprint)
	{
		var utype = stream.readUint16();
		var name = stream.readString();
		var valname = stream.readString();
		
		if(canprint)
			KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: importAlias(" + name + ":" + valname + ")!");
		
		if(name == "FIXED_DICT")
		{
			var datatype = new KBEngine.DATATYPE_FIXED_DICT();
			var keysize = stream.readUint8();
			datatype.implementedBy = stream.readString();
				
			while(keysize > 0)
			{
				keysize--;
				
				var keyname = stream.readString();
				var keyutype = stream.readUint16();
				datatype.dicttype[keyname] = keyutype;
			};
			
			KBEngine.datatypes[valname] = datatype;
		}
		else if(name == "ARRAY")
		{
			var uitemtype = stream.readUint16();
			var datatype = new KBEngine.DATATYPE_ARRAY();
			datatype.type = uitemtype;
			KBEngine.datatypes[valname] = datatype;
		}
		else
		{
			KBEngine.datatypes[valname] = KBEngine.datatypes[name];
		}

		KBEngine.datatypes[utype] = KBEngine.datatypes[valname];
		
		// 将用户自定义的类型补充到映射表中
		KBEngine.datatype2id[valname] = utype;
	}
	
	this.Client_onImportClientEntityDef = function(stream)
	{
		KBEngine.app.createDataTypeFromStreams(stream, true);
	
		for(datatype in KBEngine.datatypes)
		{
			if(KBEngine.datatypes[datatype] != undefined)
			{
				KBEngine.datatypes[datatype].bind();
			}
		}
		
		while(!stream.readEOF())
		{
			var scriptmethod_name = stream.readString();
			var scriptUtype = stream.readUint16();
			var propertysize = stream.readUint16();
			var methodsize = stream.readUint16();
			var base_methodsize = stream.readUint16();
			var cell_methodsize = stream.readUint16();
			
			KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: import(" + scriptmethod_name + "), propertys(" + propertysize + "), " +
					"clientMethods(" + methodsize + "), baseMethods(" + base_methodsize + "), cellMethods(" + cell_methodsize + ")!");
			
			KBEngine.moduledefs[scriptmethod_name] = {};
			var currModuleDefs = KBEngine.moduledefs[scriptmethod_name];
			currModuleDefs["name"] = scriptmethod_name;
			currModuleDefs["propertys"] = {};
			currModuleDefs["methods"] = {};
			currModuleDefs["base_methods"] = {};
			currModuleDefs["cell_methods"] = {};
			KBEngine.moduledefs[scriptUtype] = currModuleDefs;
			
			var self_propertys = currModuleDefs["propertys"];
			var self_methods = currModuleDefs["methods"];
			var self_base_methods = currModuleDefs["base_methods"];
			var self_cell_methods= currModuleDefs["cell_methods"];
			
			try
			{
				var Class = eval("KBEngine." + scriptmethod_name);
			}
			catch(e)
			{
				var Class = undefined;
			}
			
			while(propertysize > 0)
			{
				propertysize--;
				
				var properUtype = stream.readUint16();
				var properFlags = stream.readUint32();
				var aliasID = stream.readInt16();
				var name = stream.readString();
				var defaultValStr = stream.readString();
				var utype = KBEngine.datatypes[stream.readUint16()];
				var setmethod = null;
				if(Class != undefined)
				{
					setmethod = Class.prototype["set_" + name];
					if(setmethod == undefined)
						setmethod = null;
				}
				
				var savedata = [properUtype, aliasID, name, defaultValStr, utype, setmethod, properFlags];
				self_propertys[name] = savedata;
				
				if(aliasID >= 0)
				{
					self_propertys[aliasID] = savedata;
					currModuleDefs["usePropertyDescrAlias"] = true;
				}
				else
				{
					self_propertys[properUtype] = savedata;
					currModuleDefs["usePropertyDescrAlias"] = false;
				}
				
				KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: add(" + scriptmethod_name + "), property(" + name + "/" + properUtype + ").");
			};
			
			while(methodsize > 0)
			{
				methodsize--;
				
				var methodUtype = stream.readUint16();
				var aliasID = stream.readInt16();
				var name = stream.readString();
				var argssize = stream.readUint8();
				var args = [];
				
				while(argssize > 0)
				{
					argssize--;
					args.push(KBEngine.datatypes[stream.readUint16()]);
				};
				
				var savedata = [methodUtype, aliasID, name, args];
				self_methods[name] = savedata;
				
				if(aliasID >= 0)
				{
					self_methods[aliasID] = savedata;
					currModuleDefs["useMethodDescrAlias"] = true;
				}
				else
				{
					self_methods[methodUtype] = savedata;
					currModuleDefs["useMethodDescrAlias"] = false;
				}
				
				KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: add(" + scriptmethod_name + "), method(" + name + ").");
			};

			while(base_methodsize > 0)
			{
				base_methodsize--;
				
				var methodUtype = stream.readUint16();
				var aliasID = stream.readInt16();
				var name = stream.readString();
				var argssize = stream.readUint8();
				var args = [];
				
				while(argssize > 0)
				{
					argssize--;
					args.push(KBEngine.datatypes[stream.readUint16()]);
				};
				
				self_base_methods[name] = [methodUtype, aliasID, name, args];
				KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: add(" + scriptmethod_name + "), base_method(" + name + ").");
			};
			
			while(cell_methodsize > 0)
			{
				cell_methodsize--;
				
				var methodUtype = stream.readUint16();
				var aliasID = stream.readInt16();
				var name = stream.readString();
				var argssize = stream.readUint8();
				var args = [];
				
				while(argssize > 0)
				{
					argssize--;
					args.push(KBEngine.datatypes[stream.readUint16()]);
				};
				
				self_cell_methods[name] = [methodUtype, aliasID, name, args];
				KBEngine.INFO_MSG("KBEngineApp::Client_onImportClientEntityDef: add(" + scriptmethod_name + "), cell_method(" + name + ").");
			};
			
			try
			{
				defmethod = eval("KBEngine." + scriptmethod_name);
			}
			catch(e)
			{
				KBEngine.ERROR_MSG("KBEngineApp::Client_onImportClientEntityDef: module(" + scriptmethod_name + ") not found!");
				defmethod = undefined;
			}
			
			for(name in currModuleDefs.propertys)
			{
				var infos = currModuleDefs.propertys[name];
				var properUtype = infos[0];
				var aliasID = infos[1];
				var name = infos[2];
				var defaultValStr = infos[3];
				var utype = infos[4];

				if(defmethod != undefined)
					defmethod.prototype[name] = utype.parseDefaultValStr(defaultValStr);
			};

			for(name in currModuleDefs.methods)
			{
				var infos = currModuleDefs.methods[name];
				var properUtype = infos[0];
				var aliasID = infos[1];
				var name = infos[2];
				var args = infos[3];
				
				if(defmethod != undefined && defmethod.prototype[name] == undefined)
				{
					KBEngine.WARNING_MSG(scriptmethod_name + ":: method(" + name + ") no implement!");
				}
			};
		}
		
		KBEngine.app.onImportEntityDefCompleted();
	}

	this.Client_onVersionNotMatch = function(stream)
	{
		this.serverVersion = stream.readString();
		KBEngine.ERROR_MSG("Client_onVersionNotMatch: verInfo=" + KBEngine.app.clientVersion + " not match(server: " + KBEngine.app.serverVersion + ")");
		KBEngine.Event.fire("onVersionNotMatch", this.clientVersion, this.serverVersion);
	}

	this.Client_onScriptVersionNotMatch = function(stream)
	{
		this.serverScriptVersion = stream.readString();
		KBEngine.ERROR_MSG("Client_onScriptVersionNotMatch: verInfo=" + KBEngine.app.clientScriptVersion + " not match(server: " + KBEngine.app.serverScriptVersion + ")");
		KBEngine.Event.fire("onScriptVersionNotMatch", this.clientScriptVersion, this.serverScriptVersion);
	}
	
	this.onImportEntityDefCompleted = function()
	{
		KBEngine.INFO_MSG("KBEngineApp::onImportEntityDefCompleted: successfully!");
		KBEngine.app.entitydefImported = true;
		KBEngine.app.login_baseapp(false);
	}
	
	this.Client_onImportClientMessages = function(msg)
	{
		var stream = new KBEngine.MemoryStream(msg.data);
		var msgid = stream.readUint16();

		if(msgid == KBEngine.messages.onImportClientMessages.id)
		{
			var msglen = stream.readUint16();
			var msgcount = stream.readUint16();
			
			KBEngine.INFO_MSG("KBEngineApp::onImportClientMessages: start(" + msgcount + ") ...!");
			
			while(msgcount > 0)
			{
				msgcount--;
				
				msgid = stream.readUint16();
				msglen = stream.readInt16();
				var msgname = stream.readString();
				var argtype = stream.readInt8();
				var argsize = stream.readUint8();
				var argstypes = new Array(argsize);
				
				for(var i=0; i<argsize; i++)
				{
					argstypes[i] = stream.readUint8();
				}
				
				var handler = null;
				var isClientMethod = msgname.indexOf("Client_") >= 0;
				if(isClientMethod)
				{
					handler = KBEngine.app[msgname];
					if(handler == null || handler == undefined)
					{
						KBEngine.WARNING_MSG("KBEngineApp::onImportClientMessages[" + KBEngine.app.currserver + "]: interface(" + msgname + "/" + msgid + ") no implement!");
						handler = null;
					}
					else
					{
						KBEngine.INFO_MSG("KBEngineApp::onImportClientMessages: import(" + msgname + ") successfully!");
					}
				}
			
				if(msgname.length > 0)
				{
					KBEngine.messages[msgname] = new KBEngine.Message(msgid, msgname, msglen, argtype, argstypes, handler);
					
					if(isClientMethod)
						KBEngine.clientmessages[msgid] = KBEngine.messages[msgname];
					else
						KBEngine.messages[KBEngine.app.currserver][msgid] = KBEngine.messages[msgname];
				}
				else
				{
					KBEngine.messages[KBEngine.app.currserver][msgid] = new KBEngine.Message(msgid, msgname, msglen, argtype, argstypes, handler);
				}
			};

			KBEngine.app.onImportClientMessagesCompleted();
		}
		else
			KBEngine.ERROR_MSG("KBEngineApp::onmessage: not found msg(" + msgid + ")!");
	}
	
	this.createAccount = function(username, password, datas)
	{  
		KBEngine.app.username = username;
		KBEngine.app.password = password;
		KBEngine.app.clientdatas = datas;
		
		KBEngine.app.createAccount_loginapp(true);
	}
	
	this.createAccount_loginapp = function(noconnect)
	{  
		if(noconnect)
		{
			KBEngine.INFO_MSG("KBEngineApp::createAccount_loginapp: start connect to ws://" + KBEngine.app.ip + ":" + KBEngine.app.port + "!");
			KBEngine.app.connect("ws://" + KBEngine.app.ip + ":" + KBEngine.app.port);
			KBEngine.app.socket.onopen = KBEngine.app.onOpenLoginapp_createAccount;  
		}
		else
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_reqCreateAccount);
			bundle.writeString(KBEngine.app.username);
			bundle.writeString(KBEngine.app.password);
			bundle.writeBlob(KBEngine.app.clientdatas);
			bundle.send(KBEngine.app);
		}
	}
	
	this.bind_email = function(mailstr)
	{  
		var bundle = new KBEngine.Bundle();
		bundle.newMessage(KBEngine.messages.Baseapp_reqAccountBindEmail);
		bundle.writeInt32(KBEngine.app.entity_id);
		bundle.writeString(KBEngine.app.password);
		bundle.writeString(mailstr);
		bundle.send(KBEngine.app);
	}
	
	this.new_password = function(oldpassword, newpassword)
	{
		var bundle = new KBEngine.Bundle();
		bundle.newMessage(KBEngine.messages.Baseapp_reqAccountNewPassword);
		bundle.writeInt32(KBEngine.app.entity_id);
		bundle.writeString(oldpassword);
		bundle.writeString(newpassword);
		bundle.send(KBEngine.app);
	}
	
	this.login = function(username, password, datas)
	{  
		KBEngine.app.username = username;
		KBEngine.app.password = password;
		KBEngine.app.clientdatas = datas;
		
		KBEngine.app.login_loginapp(true);
	}
	
	this.login_loginapp = function(noconnect)
	{  
		if(noconnect)
		{
			KBEngine.INFO_MSG("KBEngineApp::login_loginapp: start connect to ws://" + KBEngine.app.ip + ":" + KBEngine.app.port + "!");
			KBEngine.app.connect("ws://" + KBEngine.app.ip + ":" + KBEngine.app.port);
			KBEngine.app.socket.onopen = KBEngine.app.onOpenLoginapp_login;  
		}
		else
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_login);
			bundle.writeInt8(KBEngine.app.args.clientType); // clientType
			bundle.writeBlob(KBEngine.app.clientdatas);
			bundle.writeString(KBEngine.app.username);
			bundle.writeString(KBEngine.app.password);
			bundle.send(KBEngine.app);
		}
	}

	this.onOpenLoginapp_resetpassword = function()
	{  
		KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_resetpassword: successfully!");
		KBEngine.app.currserver = "loginapp";
		KBEngine.app.currstate = "resetpassword";
		
		if(!KBEngine.app.loginappMessageImported)
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_importClientMessages);
			bundle.send(KBEngine.app);
			KBEngine.app.socket.onmessage = KBEngine.app.Client_onImportClientMessages;  
			KBEngine.INFO_MSG("KBEngineApp::onOpenLoginapp_resetpassword: start importClientMessages ...");
		}
		else
		{
			KBEngine.app.onImportClientMessagesCompleted();
		}
	}

	this.reset_password = function(username)
	{ 
		KBEngine.app.username = username;
		KBEngine.app.resetpassword_loginapp(true);
	}
	
	this.resetpassword_loginapp = function(noconnect)
	{  
		if(noconnect)
		{
			KBEngine.INFO_MSG("KBEngineApp::createAccount_loginapp: start connect to ws://" + KBEngine.app.ip + ":" + KBEngine.app.port + "!");
			KBEngine.app.connect("ws://" + KBEngine.app.ip + ":" + KBEngine.app.port);
			KBEngine.app.socket.onopen = KBEngine.app.onOpenLoginapp_resetpassword;  
		}
		else
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Loginapp_reqAccountResetPassword);
			bundle.writeString(KBEngine.app.username);
			bundle.send(KBEngine.app);
		}
	}
	
	this.onOpenBaseapp = function()
	{
		KBEngine.INFO_MSG("KBEngineApp::onOpenBaseapp: successfully!");
		KBEngine.app.currserver = "baseapp";
		
		if(!KBEngine.app.baseappMessageImported)
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Baseapp_importClientMessages);
			bundle.send(KBEngine.app);
			KBEngine.app.socket.onmessage = KBEngine.app.Client_onImportClientMessages;  
			KBEngine.Event.fire("Baseapp_importClientMessages");
		}
		else
		{
			KBEngine.app.onImportClientMessagesCompleted();
		}
	}
	
	this.login_baseapp = function(noconnect)
	{  
		if(noconnect)
		{
			KBEngine.Event.fire("login_baseapp");
			KBEngine.INFO_MSG("KBEngineApp::login_baseapp: start connect to ws://" + KBEngine.app.baseappIp + ":" + KBEngine.app.baseappPort + "!");
			KBEngine.app.connect("ws://" + KBEngine.app.baseappIp + ":" + KBEngine.app.baseappPort);
			KBEngine.app.socket.onopen = KBEngine.app.onOpenBaseapp;  
		}
		else
		{
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Baseapp_loginGateway);
			bundle.writeString(KBEngine.app.username);
			bundle.writeString(KBEngine.app.password);
			bundle.send(KBEngine.app);
		}
	}
	
	this.relogin_baseapp = function()
	{  
		KBEngine.Event.fire("onRelogin_baseapp");
		KBEngine.INFO_MSG("KBEngineApp::relogin_baseapp: start connect to ws://" + KBEngine.app.baseappIp + ":" + KBEngine.app.baseappPort + "!");
		KBEngine.app.connect("ws://" + KBEngine.app.baseappIp + ":" + KBEngine.app.baseappPort);
		KBEngine.app.socket.onopen = KBEngine.app.onReOpenBaseapp;  
	}
	
	this.onReOpenBaseapp = function()
	{
		KBEngine.INFO_MSG("KBEngineApp::onReOpenBaseapp: successfully!");
		KBEngine.app.currserver = "baseapp";
		
		var bundle = new KBEngine.Bundle();
		bundle.newMessage(KBEngine.messages.Baseapp_reLoginGateway);
		bundle.writeString(KBEngine.app.username);
		bundle.writeString(KBEngine.app.password);
		bundle.writeUint64(KBEngine.app.entity_uuid);
		bundle.writeInt32(KBEngine.app.entity_id);
		bundle.send(KBEngine.app);
	}
	
	this.Client_onHelloCB = function(args)
	{
		KBEngine.app.serverVersion = args.readString();
		KBEngine.app.serverScriptVersion = args.readString();
		KBEngine.app.serverProtocolMD5 = args.readString();
		KBEngine.app.serverEntityDefMD5 = args.readString();
		
		var ctype = args.readInt32();
		
		KBEngine.INFO_MSG("KBEngineApp::Client_onHelloCB: verInfo(" + KBEngine.app.serverVersion + "), scriptVerInfo(" + 
			KBEngine.app.serverScriptVersion + "), serverProtocolMD5(" + KBEngine.app.serverProtocolMD5 + "), serverEntityDefMD5(" + 
			KBEngine.app.serverEntityDefMD5 + "), ctype(" + ctype + ")!");
	}
	
	this.Client_onLoginFailed = function(args)
	{
		var failedcode = args.readUint16();
		KBEngine.app.serverdatas = args.readBlob();
		KBEngine.ERROR_MSG("KBEngineApp::Client_onLoginFailed: failedcode(" + failedcode + "), datas(" + KBEngine.app.serverdatas.length + ")!");
		KBEngine.Event.fire("onLoginFailed", failedcode);
	}
	
	this.Client_onLoginSuccessfully = function(args)
	{
		var accountName = args.readString();
		KBEngine.app.username = accountName;
		KBEngine.app.baseappIp = args.readString();
		KBEngine.app.baseappPort = args.readUint16();
		KBEngine.app.serverdatas = args.readBlob();
		
		KBEngine.INFO_MSG("KBEngineApp::Client_onLoginSuccessfully: accountName(" + accountName + "), addr(" + 
				KBEngine.app.baseappIp + ":" + KBEngine.app.baseappPort + "), datas(" + KBEngine.app.serverdatas.length + ")!");
		
		KBEngine.app.disconnect();
		KBEngine.app.login_baseapp(true);
	}
	
	this.Client_onLoginGatewayFailed = function(failedcode)
	{
		KBEngine.ERROR_MSG("KBEngineApp::Client_onLoginGatewayFailed: failedcode(" + failedcode + ")!");
		KBEngine.Event.fire("onLoginGatewayFailed", failedcode);
	}

	this.Client_onReLoginGatewaySuccessfully = function(stream)
	{
		KBEngine.app.entity_uuid = stream.readUint64();
		KBEngine.ERROR_MSG("KBEngineApp::Client_onReLoginGatewaySuccessfully: " + KBEngine.app.username);
		KBEngine.Event.fire("onReLoginGatewaySuccessfully");
	}
	
	this.entityclass = {};
	this.getentityclass = function(entityType)
	{
		var runclass = KBEngine.app.entityclass[entityType];
		if(runclass == undefined)
		{
			runclass = eval("KBEngine." + entityType);
			if(runclass == undefined)
			{
				KBEngine.ERROR_MSG("KBEngineApp::getentityclass: entityType(" + entityType + ") is error!");
				return runclass;
			}
			else
				KBEngine.app.entityclass[entityType] = runclass;
		}

		return runclass;
	}
	
	this.Client_onCreatedProxies = function(rndUUID, eid, entityType)
	{
		KBEngine.INFO_MSG("KBEngineApp::Client_onCreatedProxies: eid(" + eid + "), entityType(" + entityType + ")!");
		
		var entity = KBEngine.app.entities[eid];
		
		if(entity != undefined)
		{
			// KBEngine.WARNING_MSG("KBEngineApp::Client_onCreatedProxies: entity(" + eid + ") has exist!");
			return;
		}
				
		KBEngine.app.entity_uuid = rndUUID;
		KBEngine.app.entity_id = eid;
		
		var runclass = KBEngine.app.getentityclass(entityType);
		if(runclass == undefined)
			return;
		
		var entity = new runclass();
		entity.id = eid;
		entity.className = entityType;
		
		entity.base = new KBEngine.Mailbox();
		entity.base.id = eid;
		entity.base.className = entityType;
		entity.base.type = KBEngine.MAILBOX_TYPE_BASE;
		
		KBEngine.app.entities[eid] = entity;
		
		var entityMessage = KBEngine.bufferedCreateEntityMessage[eid];
		if(entityMessage != undefined)
		{
			KBEngine.app.Client_onUpdatePropertys(entityMessage);
			delete KBEngine.bufferedCreateEntityMessage[eid];
		}
			
		entity.__init__();
	}
	
	this.getAoiEntityIDFromStream = function(stream)
	{
		var id = 0;
		if(KBEngine.app.entityIDAliasIDList.Length > 255)
		{
			id = stream.readInt32();
		}
		else
		{
			id = KBEngine.app.entityIDAliasIDList[stream.readUint8()];
		}
		
		// 如果为0且客户端上一步是重登陆或者重连操作并且服务端entity在断线期间一直处于在线状态
		// 则可以忽略这个错误, 因为cellapp可能一直在向baseapp发送同步消息， 当客户端重连上时未等
		// 服务端初始化步骤开始则收到同步信息, 此时这里就会出错。
		if(KBEngine.app.entityIDAliasIDList.length == 0)
			return 0;
		
		return id;
	}
	
	this.onUpdatePropertys_ = function(eid, stream)
	{
		var entity = KBEngine.app.entities[eid];
		
		if(entity == undefined)
		{
			var entityMessage = KBEngine.bufferedCreateEntityMessage[eid];
			if(entityMessage != undefined)
			{
				KBEngine.ERROR_MSG("KBEngineApp::Client_onUpdatePropertys: entity(" + eid + ") not found!");
				return;
			}
			
			var stream1 = new KBEngine.MemoryStream(stream.buffer);
			stream1.wpos = stream.wpos;
			stream1.rpos = stream.rpos - 4;
			KBEngine.bufferedCreateEntityMessage[eid] = stream1;
			return;
		}
		
		var currModule = KBEngine.moduledefs[entity.className];
		var pdatas = currModule.propertys;
		while(stream.length() > 0)
		{
			var utype = 0;
			if(currModule.usePropertyDescrAlias)
				utype = stream.readUint8();
			else
				utype = stream.readUint16();
		
			var propertydata = pdatas[utype];
			var setmethod = propertydata[5];
			var flags = propertydata[6];
			var val = propertydata[4].createFromStream(stream);
			var oldval = entity[utype];
			
			KBEngine.INFO_MSG("KBEngineApp::Client_onUpdatePropertys: " + entity.className + "(id=" + eid  + " " + propertydata[2] + ", val=" + val + ")!");
			
			entity[propertydata[2]] = val;
			if(setmethod != null)
			{
				// base类属性或者进入世界后cell类属性会触发set_*方法
				if(flags == 0x00000020 || flags == 0x00000040 || entity.inWorld)
					setmethod.apply(entity, oldval);
			}
		}
	}

	this.Client_onUpdatePropertysOptimized = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		KBEngine.app.onUpdatePropertys_(eid, stream);
	}
	
	this.Client_onUpdatePropertys = function(stream)
	{
		var eid = stream.readInt32();
		KBEngine.app.onUpdatePropertys_(eid, stream);
	}

	this.onRemoteMethodCall_ = function(eid, stream)
	{
		var entity = KBEngine.app.entities[eid];
		
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onRemoteMethodCall: entity(" + eid + ") not found!");
			return;
		}
		
		var methodUtype = 0;
		if(KBEngine.moduledefs[entity.className].useMethodDescrAlias)
			methodUtype = stream.readUint8();
		else
			methodUtype = stream.readUint16();
		
		var methoddata = KBEngine.moduledefs[entity.className].methods[methodUtype];
		var args = [];
		var argsdata = methoddata[3];
		for(var i=0; i<argsdata.length; i++)
		{
			args.push(argsdata[i].createFromStream(stream));
		}
		
		if(entity[methoddata[2]] != undefined)
		{
			entity[methoddata[2]].apply(entity, args);
		}
		else
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onRemoteMethodCall: entity(" + eid + ") not found method(" + methoddata[2] + ")!");
		}
	}
	
	this.Client_onRemoteMethodCallOptimized = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		KBEngine.app.onRemoteMethodCall_(eid, stream);
	}
	
	this.Client_onRemoteMethodCall = function(stream)
	{
		var eid = stream.readInt32();
		KBEngine.app.onRemoteMethodCall_(eid, stream);
	}
	
	this.Client_onEntityEnterWorld = function(stream)
	{
		var eid = stream.readInt32();
		if(KBEngine.app.entity_id > 0 && eid != KBEngine.app.entity_id)
			KBEngine.app.entityIDAliasIDList.push(eid)
		
		var entityType;
		if(KBEngine.moduledefs.Length > 255)
			entityType = stream.readUint16();
		else
			entityType = stream.readUint8();
		
		var isOnGound = true;
		
		if(stream.length() > 0)
			isOnGound = stream.readInt8();
		
		entityType = KBEngine.moduledefs[entityType].name;
		KBEngine.INFO_MSG("KBEngineApp::Client_onEntityEnterWorld: " + entityType + "(" + eid + "), spaceID(" + KBEngine.app.spaceID + "), isOnGound(" + isOnGound + ")!");
		
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			entityMessage = KBEngine.bufferedCreateEntityMessage[eid];
			if(entityMessage == undefined)
			{
				KBEngine.ERROR_MSG("KBEngineApp::Client_onEntityEnterWorld: entity(" + eid + ") not found!");
				return;
			}
			
			var runclass = KBEngine.app.getentityclass(entityType);
			if(runclass == undefined)
				return;
			
			var entity = new runclass();
			entity.id = eid;
			entity.className = entityType;
			
			entity.cell = new KBEngine.Mailbox();
			entity.cell.id = eid;
			entity.cell.className = entityType;
			entity.cell.type = KBEngine.MAILBOX_TYPE_CELL;
			
			KBEngine.app.entities[eid] = entity;
			
			KBEngine.app.Client_onUpdatePropertys(entityMessage);
			delete KBEngine.bufferedCreateEntityMessage[eid];
			
			entity.isOnGound = isOnGound > 0;
			entity.__init__();
			entity.onEnterWorld();
			
			KBEngine.Event.fire("set_direction", entity);
			KBEngine.Event.fire("set_position", entity);
		}
		else
		{
			if(!entity.inWorld)
			{
				entity.cell = new KBEngine.Mailbox();
				entity.cell.id = eid;
				entity.cell.className = entityType;
				entity.cell.type = KBEngine.MAILBOX_TYPE_CELL;
			
				// 安全起见， 这里清空一下
				// 如果服务端上使用giveClientTo切换控制权
				// 之前的实体已经进入世界， 切换后的实体也进入世界， 这里可能会残留之前那个实体进入世界的信息
				KBEngine.app.entityIDAliasIDList = [];
				KBEngine.app.entities = {}
				KBEngine.app.entities[entity.id] = entity;
			
				KBEngine.app.entityServerPos.x = entity.position.x;
				KBEngine.app.entityServerPos.y = entity.position.y;
				KBEngine.app.entityServerPos.z = entity.position.z;
				
				entity.isOnGound = isOnGound > 0;
				entity.onEnterWorld();
			}
		}
	}

	this.Client_onEntityLeaveWorldOptimized = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		KBEngine.app.Client_onEntityLeaveWorld(eid);
	}
	
	this.Client_onEntityLeaveWorld = function(eid)
	{
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onEntityLeaveWorld: entity(" + eid + ") not found!");
			return;
		}
		
		if(entity.inWorld)
			entity.onLeaveWorld();
		
		if(KBEngine.app.entity_id > 0 && eid != KBEngine.app.entity_id)
		{
			delete KBEngine.app.entities[eid];
			
			var newArray = [];
			for(var i=0; i<KBEngine.app.entityIDAliasIDList.length; i++){
			    if(KBEngine.app.entityIDAliasIDList[i] != eid){
			       newArray.push(KBEngine.app.entityIDAliasIDList[i]);
			     }
			}
			
			KBEngine.app.entityIDAliasIDList = newArray
		}
		else
		{
			KBEngine.app.clearSpace(false);
			entity.cell = null;
		}
	}

	this.Client_onEntityDestroyed = function(eid)
	{
		KBEngine.INFO_MSG("KBEngineApp::Client_onEntityDestroyed: entity(" + eid + ")!");
		
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onEntityDestroyed: entity(" + eid + ") not found!");
			return;
		}

		if(entity.inWorld)
			entity.onLeaveWorld();
		
		delete KBEngine.app.entities[eid];
	}
	
	this.Client_onEntityEnterSpace = function(stream)
	{
		var eid = stream.readInt32();
		KBEngine.app.spaceID = stream.readUint32();
		var isOnGound = true;
		
		if(stream.length() > 0)
			isOnGound = stream.readInt8();
		
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onEntityEnterSpace: entity(" + eid + ") not found!");
			return;
		}
		
		KBEngine.app.entityServerPos.x = entity.position.x;
		KBEngine.app.entityServerPos.y = entity.position.y;
		KBEngine.app.entityServerPos.z = entity.position.z;		
		entity.onEnterSpace();
	}
	
	this.Client_onEntityLeaveSpace = function(eid)
	{
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onEntityLeaveSpace: entity(" + eid + ") not found!");
			return;
		}
		
		KBEngine.app.clearSpace(false);
		entity.onLeaveSpace();
	}

	this.Client_onKicked = function(failedcode)
	{
		KBEngine.ERROR_MSG("KBEngineApp::Client_onKicked: failedcode(" + failedcode + ")!");
		KBEngine.Event.fire("onKicked", failedcode);
	}

	this.Client_onCreateAccountResult = function(stream)
	{
		var retcode = stream.readUint16();
		var datas = stream.readBlob();
		
		if(retcode != 0)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onCreateAccountResult: " + KBEngine.app.username + " create is failed! code=" + retcode + "!");
			return;
		}

		KBEngine.Event.fire("onCreateAccountResult", retcode, datas);
		KBEngine.INFO_MSG("KBEngineApp::Client_onCreateAccountResult: " + KBEngine.app.username + " create is successfully!");
	}
	
	this.updatePlayerToServer = function()
	{
		var player = KBEngine.app.player();
		if(player == undefined || player.inWorld == false || KBEngine.app.spaceID == 0)
			return;
		
		if(KBEngine.app.entityLastLocalPos.distance(player.position) > 0.001 || KBEngine.app.entityLastLocalDir.distance(player.direction) > 0.001)
		{
			// 记录玩家最后一次上报位置时自身当前的位置
			KBEngine.app.entityLastLocalPos.x = player.position.x;
			KBEngine.app.entityLastLocalPos.y = player.position.y;
			KBEngine.app.entityLastLocalPos.z = player.position.z;
			KBEngine.app.entityLastLocalDir.x = player.direction.x;
			KBEngine.app.entityLastLocalDir.y = player.direction.y;
			KBEngine.app.entityLastLocalDir.z = player.direction.z;	
							
			var bundle = new KBEngine.Bundle();
			bundle.newMessage(KBEngine.messages.Baseapp_onUpdateDataFromClient);
			bundle.writeFloat(player.position.x);
			bundle.writeFloat(player.position.y);
			bundle.writeFloat(player.position.z);
			bundle.writeFloat(player.direction.x);
			bundle.writeFloat(player.direction.y);
			bundle.writeFloat(player.direction.z);
			bundle.writeUint8(KBEngine.app.isOnGound);
			bundle.writeUint32(KBEngine.app.spaceID);
			bundle.send(KBEngine.app);
		}
	}
	
	this.addSpaceGeometryMapping = function(spaceID, respath)
	{
		KBEngine.INFO_MSG("KBEngineApp::addSpaceGeometryMapping: spaceID(" + spaceID + "), respath(" + respath + ")!");
		
		KBEngine.app.spaceID = spaceID;
		KBEngine.app.spaceResPath = respath;
		KBEngine.Event.fire("addSpaceGeometryMapping", respath);
	}

	this.clearSpace = function(isAll)
	{
		KBEngine.app.entityIDAliasIDList = [];
		KBEngine.app.spacedata = {};
		KBEngine.app.clearEntities(isAll);
		KBEngine.app.isLoadedGeometry = false;
		KBEngine.app.spaceID = 0;
	}

	this.clearEntities = function(isAll)
	{
		if(!isAll)
		{
			var entity = KBEngine.app.player();
			
			for (var eid in KBEngine.app.entities)  
			{ 
				if(eid == entity.id)
					continue;
				
				if(KBEngine.app.entities[eid].inWorld)
				{
			    	KBEngine.app.entities[eid].onLeaveWorld();
			    }
			    
			    KBEngine.app.entities[eid].onDestroy();
			}  
				
			KBEngine.app.entities = {}
			KBEngine.app.entities[entity.id] = entity;
		}
		else
		{
			for (var eid in KBEngine.app.entities)  
			{ 
				if(KBEngine.app.entities[eid].inWorld)
			    {
			    	KBEngine.app.entities[eid].onLeaveWorld();
			    }
			    
			    KBEngine.app.entities[eid].onDestroy();
			}  
				
			KBEngine.app.entities = {}
		}
	}

	this.Client_initSpaceData = function(stream)
	{
		KBEngine.app.clearSpace(false);
		
		KBEngine.app.spaceID = stream.readInt32();
		while(stream.length() > 0)
		{
			var key = stream.readString();
			var value = stream.readString();
			KBEngine.app.Client_setSpaceData(KBEngine.app.spaceID, key, value);
		}
		
		KBEngine.INFO_MSG("KBEngineApp::Client_initSpaceData: spaceID(" + KBEngine.app.spaceID + "), datas(" + KBEngine.app.spacedata + ")!");
	}
	
	this.Client_setSpaceData = function(spaceID, key, value)
	{
		KBEngine.INFO_MSG("KBEngineApp::Client_setSpaceData: spaceID(" + spaceID + "), key(" + key + "), value(" + value + ")!");
		
		KBEngine.app.spacedata[key] = value;
		
		if(key == "_mapping")
			KBEngine.app.addSpaceGeometryMapping(spaceID, value);
		
		KBEngine.Event.fire("onSetSpaceData", spaceID, key, value);
	}
	
	this.Client_delSpaceData = function(spaceID, key)
	{
		KBEngine.INFO_MSG("KBEngineApp::Client_delSpaceData: spaceID(" + spaceID + "), key(" + key + ")!");
		
		delete KBEngine.app.spacedata[key];
		KBEngine.Event.fire("onDelSpaceData", spaceID, key);
	}
	
	this.Client_getSpaceData = function(spaceID, key)
	{
		return KBEngine.app.spacedata[key];
	}
	
	this.Client_onUpdateBasePos = function(stream)
	{
		KBEngine.app.entityServerPos.x = stream.readFloat();
		KBEngine.app.entityServerPos.y = stream.readFloat();
		KBEngine.app.entityServerPos.z = stream.readFloat();
	}
	
	this.Client_onUpdateBasePosXZ = function(stream)
	{
		KBEngine.app.entityServerPos.x = stream.readFloat();
		KBEngine.app.entityServerPos.z = stream.readFloat();
	}
	
	this.Client_onUpdateData = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onUpdateData: entity(" + eid + ") not found!");
			return;
		}
	}

	this.Client_onSetEntityPosAndDir = function(stream)
	{
		var eid = stream.readInt32();
		var entity = KBEngine.app.entities[eid];
		if(entity == undefined)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onSetEntityPosAndDir: entity(" + eid + ") not found!");
			return;
		}
		
		entity.position.x = stream.readFloat();
		entity.position.y = stream.readFloat();
		entity.position.z = stream.readFloat();
		entity.direction.x = stream.readFloat();
		entity.direction.y = stream.readFloat();
		entity.direction.z = stream.readFloat();
		
		// 记录玩家最后一次上报位置时自身当前的位置
		KBEngine.app.entityLastLocalPos.x = entity.position.x;
		KBEngine.app.entityLastLocalPos.y = entity.position.y;
		KBEngine.app.entityLastLocalPos.z = entity.position.z;
		KBEngine.app.entityLastLocalDir.x = entity.direction.x;
		KBEngine.app.entityLastLocalDir.y = entity.direction.y;
		KBEngine.app.entityLastLocalDir.z = entity.direction.z;	
				
		KBEngine.Event.fire("set_direction", entity);
		KBEngine.Event.fire("set_position", entity);
	}
	
	this.Client_onUpdateData_ypr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var y = stream.readInt8();
		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, y, p, r, -1);
	}
	
	this.Client_onUpdateData_yp = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var y = stream.readInt8();
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, y, p, KBEngine.KBE_FLT_MAX, -1);
	}
	
	this.Client_onUpdateData_yr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var y = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, y, KBEngine.KBE_FLT_MAX, r, -1);
	}
	
	this.Client_onUpdateData_pr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, KBEngine.KBE_FLT_MAX, p, r, -1);
	}
	
	this.Client_onUpdateData_y = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var y = stream.readPackY();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, y, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, -1);
	}
	
	this.Client_onUpdateData_p = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, KBEngine.KBE_FLT_MAX, p, KBEngine.KBE_FLT_MAX, -1);
	}
	
	this.Client_onUpdateData_r = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, 0.0, 0.0, 0.0, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, r, -1);
	}
	
	this.Client_onUpdateData_xz = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, 1);
	}
	
	this.Client_onUpdateData_xz_ypr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var y = stream.readInt8();
		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], y, p, r, 1);
	}
	
	this.Client_onUpdateData_xz_yp = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var y = stream.readInt8();
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], y, p, KBEngine.KBE_FLT_MAX, 1);
	}
	
	this.Client_onUpdateData_xz_yr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var y = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], y, KBEngine.KBE_FLT_MAX, r, 1);
	}
	
	this.Client_onUpdateData_xz_pr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], KBEngine.KBE_FLT_MAX, p, r, 1);
	}
	
	this.Client_onUpdateData_xz_y = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var y = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], y, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, 1);
	}
	
	this.Client_onUpdateData_xz_p = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], KBEngine.KBE_FLT_MAX, p, KBEngine.KBE_FLT_MAX, 1);
	}
	
	this.Client_onUpdateData_xz_r = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();

		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], 0.0, xz[1], KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, r, 1);
	}
	
	this.Client_onUpdateData_xyz = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, 0);
	}
	
	this.Client_onUpdateData_xyz_ypr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var yaw = stream.readInt8();
		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], yaw, p, r, 0);
	}
	
	this.Client_onUpdateData_xyz_yp = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var yaw = stream.readInt8();
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], yaw, p, KBEngine.KBE_FLT_MAX, 0);
	}
	
	this.Client_onUpdateData_xyz_yr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var yaw = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], yaw, KBEngine.KBE_FLT_MAX, r, 0);
	}
	
	this.Client_onUpdateData_xyz_pr = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var p = stream.readInt8();
		var r = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, x, y, z, KBEngine.KBE_FLT_MAX, p, r, 0);
	}
	
	this.Client_onUpdateData_xyz_y = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var yaw = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], yaw, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, 0);
	}
	
	this.Client_onUpdateData_xyz_p = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], KBEngine.KBE_FLT_MAX, p, KBEngine.KBE_FLT_MAX, 0);
	}
	
	this.Client_onUpdateData_xyz_r = function(stream)
	{
		var eid = KBEngine.app.getAoiEntityIDFromStream(stream);
		
		var xz = stream.readPackXZ();
		var y = stream.readPackY();
		
		var p = stream.readInt8();
		
		KBEngine.app._updateVolatileData(eid, xz[0], y, xz[1], r, KBEngine.KBE_FLT_MAX, KBEngine.KBE_FLT_MAX, 0);
	}
	
	this._updateVolatileData = function(entityID, x, y, z, yaw, pitch, roll, isOnGound)
	{
		var entity = KBEngine.app.entities[entityID];
		if(entity == undefined)
		{
			// 如果为0且客户端上一步是重登陆或者重连操作并且服务端entity在断线期间一直处于在线状态
			// 则可以忽略这个错误, 因为cellapp可能一直在向baseapp发送同步消息， 当客户端重连上时未等
			// 服务端初始化步骤开始则收到同步信息, 此时这里就会出错。			
			KBEngine.ERROR_MSG("KBEngineApp::_updateVolatileData: entity(" + entityID + ") not found!");
			return;
		}
		
		// 小于0不设置
		if(isOnGound >= 0)
		{
			entity.isOnGound = (isOnGound > 0);
		}
		
		var changeDirection = false;
		
		if(roll != KBEngine.KBE_FLT_MAX)
		{
			changeDirection = true;
			entity.direction.x = KBEngine.int82angle(roll, false);
		}

		if(pitch != KBEngine.KBE_FLT_MAX)
		{
			changeDirection = true;
			entity.direction.y = KBEngine.int82angle(pitch, false);
		}
		
		if(yaw != KBEngine.KBE_FLT_MAX)
		{
			changeDirection = true;
			entity.direction.z = KBEngine.int82angle(yaw, false);
		}
		
		var done = false;
		if(changeDirection == true)
		{
			KBEngine.Event.fire("set_direction", entity);		
			done = true;
		}
		
		if(Math.abs(x + y + z) > 0.00001)
		{
			entity.position.x = x + KBEngine.app.entityServerPos.x;
			entity.position.y = y + KBEngine.app.entityServerPos.y;
			entity.position.z = z + KBEngine.app.entityServerPos.z;
			
			done = true;
			KBEngine.Event.fire("update_position", entity);
		}
		
		if(done)
			entity.onUpdateVolatileData();		
	}
	
	this.Client_onStreamDataStarted = function(id, datasize, descr)
	{
	}
	
	this.Client_onStreamDataRecv = function(stream)
	{
	}
	
	this.Client_onStreamDataCompleted = function(id)
	{
	}
	
	this.Client_onReqAccountResetPasswordCB = function(failcode)
	{
		if(failcode != 0)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onReqAccountResetPasswordCB: " + KBEngine.app.username + " is failed! code=" + failcode + "!");
			return;
		}

		KBEngine.INFO_MSG("KBEngineApp::Client_onReqAccountResetPasswordCB: " + KBEngine.app.username + " is successfully!");
	}
	
	this.Client_onReqAccountBindEmailCB = function(failcode)
	{
		if(failcode != 0)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onReqAccountBindEmailCB: " + KBEngine.app.username + " is failed! code=" + failcode + "!");
			return;
		}

		KBEngine.INFO_MSG("KBEngineApp::Client_onReqAccountBindEmailCB: " + KBEngine.app.username + " is successfully!");
	}
	
	this.Client_onReqAccountNewPasswordCB = function(failcode)
	{
		if(failcode != 0)
		{
			KBEngine.ERROR_MSG("KBEngineApp::Client_onReqAccountNewPasswordCB: " + KBEngine.app.username + " is failed! code=" + failcode + "!");
			return;
		}

		KBEngine.INFO_MSG("KBEngineApp::Client_onReqAccountNewPasswordCB: " + KBEngine.app.username + " is successfully!");
	}
}

KBEngine.create = function(kbengineArgs)
{
	if(KBEngine.app != undefined)
		return;
	
	new KBEngine.KBEngineApp(kbengineArgs);
	
	KBEngine.app.reset();
	KBEngine.app.installEvents();
	KBEngine.idInterval = setInterval(KBEngine.app.update, kbengineArgs.updateHZ);
}

KBEngine.destroy = function()
{
	if(KBEngine.idInterval != undefined)
		clearInterval(KBEngine.idInterval);
	
	if(KBEngine.app == undefined)
		return;
		
	KBEngine.app.uninstallEvents();
	KBEngine.app.reset();
	KBEngine.app = undefined;
}

