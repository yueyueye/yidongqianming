import CryptoJS from "crypto-js"
let storeConfig = {
	// zion项目的api地址
	// gql_apiUrl: "https://zion-app.functorz.com/zero/JmAxbl1kYqo/api/graphql-v2",
	// zion项目地址对应的authorization
	// gql_authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJhZG1pbiJdLCJaRVJPX1VTRVJfSUQiOiIxMDA5OTk5OTk5OTk5OTk5IiwiZGVmYXVsdFJvbGUiOiJhZG1pbiIsImhhc3VyYV9jbGFpbXMiOnsieC1oYXN1cmEtdXNlci1pZCI6IjEwMDk5OTk5OTk5OTk5OTkiLCJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbImFkbWluIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIn0sInplcm8iOnt9fQ.x0qj8zJQgzhk55rDbeosmSRe5hSie15rXHkt4WNyWAc",


	is_multi_app: false,
	default_system_system: null,
	system_model_list: [],
	// actionflowmain_id: "5e5e155d-7b3c-4771-bf94-ceb597cbb666",
	token: "", //调试token
	env: "H5" //1.MP-WEIXIN 2.H5
};


// 封装的更新操作，可以直接使用无需在写gql
function get_gql_debug_gql(jsCode = "", args = {}) {
	let gql = `mutation fz_invoke_action_code {
  response: fz_invoke_action_code(
    testPassword: "doushizhutou3"
    args: ${gql_string(args)}
    jsCode: "${jsCode}"
    updateDb: true
    accountId: 1000000000000001
  )
}`
	return gql;
}

function get_mutation_gql(data = {}, mode = 1, response_key = "response") {
	let {
		operation = "",
			field_string = ``,
			where = {},
			_set,
			_inc,
			objects = [], //[]或{}
			object = {},
			args,
			on_conflict,
			pk_columns,
			params,
			id,
	} = data
	let response_body = ``;
	let gql = ``;

	let op_type = operation.slice(0, 6)
	if (op_type != "update" && op_type != "delete" && op_type != "insert" && op_type != "action" && op_type !=
		"umedia") {
		throw "operation不正确，可选值：1.update 2.delete 3.insert 4.action 5.umedia"
	}
	if (op_type == "others") {
		let model = operation.slice(7);
		let params_string = ""
		if (typeof params == "object" && params && Object.keys(params).length > 0) {
			let tempStr = gql_string(params)
			params_string = `${tempStr.slice(1, tempStr.length - 1)}`;
		}
		let queryResponse = "";
		if (field_string) {
			queryResponse = ` {
			  ${field_string}
			}`;
		}
		let queryBody = "";
		if (params_string) {
			queryBody = `(${params_string})`
		}
		response_body = `${response_key}:${model}${queryBody}${queryResponse}`;
		gql = `mutation fz_others { ${response_body} }`;
		return mode === 1 ? gql : (mode === 2 ? response_body : "");
	}
	if (op_type == "action") {
		let actionflow_id = operation.slice(7);
		let args_string = `${gql_string(args||{})}`;
		response_body = `${response_key}: fz_invoke_action_code(
      testPassword: "doushizhutou3"
      args: { actionflow_id: "${actionflow_id}", actionflow_data: ${args_string} }
      jsCode: "const actionflow_data = context.getArg(\\"actionflow_data\\") || {};const actionflow_id = context.getArg(\\"actionflow_id\\") || \\"\\";let action_result = context.callActionFlow(actionflow_id, null, actionflow_data);context.setReturn(\\"action_result\\", action_result);"
      updateDb: true
      accountId: 1000000000000001
    )`
		gql = `mutation fz_action {
      ${response_body}
    }`
		return mode === 1 ? gql : (mode === 2 ? response_body : "");
	}

	if (op_type == "umedia") {
		let media_url = operation.slice(7);
		response_body = `${response_key}: fz_invoke_action_code(
      testPassword: "doushizhutou3"
      args: { media_url: "${media_url}" }
      jsCode: "const media_url = context.getArg(\\"media_url\\") || \\"\\";let umedia_result = context.uploadMedia(media_url, {});context.setReturn(\\"umedia_result\\", umedia_result);"
      updateDb: true
      accountId: 1000000000000001
    )`
		gql = `mutation fz_umedia {
        ${response_body}
      }`
		return mode === 1 ? gql : (mode === 2 ? response_body : "");
	}

	// 自动追加系统配置
	if (op_type == "insert" || op_type == "update") {
		let {
			is_multi_app: is_multi_app_tmp,
			default_system_system: default_system_system_tmp = null,
			system_model_list: system_model_list_tmp = []
		} = storeConfig
		let model = operation.slice(7)
		system_model_list_tmp.forEach(item => {
			let reg = new RegExp(`^${item}`)
			if (reg.test(model) && is_multi_app_tmp) {
				// update时
				if (!where?.system_system) {
					where.system_system = {
						_eq: default_system_system_tmp
					}
				}
				// insert时
				objects.forEach(itemObject => {
					if (!itemObject?.system_system) {
						itemObject.system_system = default_system_system_tmp
					}
				})
				// insert_xxx_one时
				if (!object?.system_system) {
					object.system_system = default_system_system_tmp
				}
			}
		})
	}

	let where_string = "";
	if (typeof where == "object" && where && Object.keys(where).length > 0) {
		where_string = `where:${gql_string(where)}`
	};

	let _set_string = "";
	if (typeof _set == "object" && _set && Object.keys(_set).length > 0) {
		_set_string = `_set:${gql_string(_set)}`
	};

	let _inc_string = "";
	if (typeof _inc == "object" && _inc && Object.keys(_inc).length > 0) {
		_inc_string = `_inc:${gql_string(_inc)}`
	};

	let objects_string = "";
	if (typeof objects == "object" && objects && Object.keys(objects).length > 0) {
		objects_string = `objects:${gql_string(objects, 3)}`
	};

	let on_conflict_string = "";
	if (typeof on_conflict == "object" && on_conflict && Object.keys(on_conflict).length > 0) {
		on_conflict_string = `on_conflict:${gql_string(on_conflict, 3)}`
	};

	let object_string = ""
	if (typeof object == "object" && object && Object.keys(object).length > 0) {
		object_string = `object:${gql_string(object, 3)}`
	}

	let pk_columns_string = ""
	if (typeof pk_columns == "object" && pk_columns && Object.keys(pk_columns).length > 0) {
		pk_columns_string = `pk_columns:${gql_string(pk_columns)}`
	}

	let id_string = ""
	if (typeof id != "undefined") {
		id_string = `id:${id}`
	}

	let responseBodyAutoAttach = "id"
	if (/insert_\w+_one/.test(operation)) {
		response_body = `${response_key}:${operation}(
		  ${object_string}
		  ${on_conflict_string}
		) {
		    ${responseBodyAutoAttach}
		    ${field_string}
		}`
	} else if (/update_\w+_by_pk/.test(operation)) {
		response_body = `${response_key}:${operation}(
		  ${_set_string}
		  ${_inc_string}
		   ${pk_columns_string}
		) {
		    ${responseBodyAutoAttach}
		    ${field_string}
		}`
	} else if (/delete_\w+_by_pk/.test(operation)) {
		response_body = `${response_key}:${operation}(
		  ${id_string}
		) {
		    ${responseBodyAutoAttach}
		    ${field_string}
		}`
	} else {
		response_body = `${response_key}:${operation}(
		  ${where_string}
		  ${_set_string}
		  ${_inc_string}
		  ${objects_string}
		  ${on_conflict_string}
		) {
		  affected_rows
		  returning{
		    ${responseBodyAutoAttach}
		    ${field_string}
		  }
		}`
	}
	gql = `mutation ${operation} {
    ${response_body}
  }`
	return mode === 1 ? gql : (mode === 2 ? response_body : "");
}
// 封装的查询操作，可以直接使用无需再写gql
function get_query_gql(data = {}, mode = 1, response_key = "response") {
	const {
		model = "account", field_string = ``, where = {}, order_by, distinct_on, offset, limit,
			id,
			fz_body, params,
			args
	} = data
	let response_body = ``;
	let gql = ``;

	// 自动加入系统配置
	let {
		is_multi_app: is_multi_app_tmp,
		default_system_system: default_system_system_tmp = null,
		system_model_list: system_model_list_tmp = []
	} = storeConfig
	system_model_list_tmp.forEach(item => {
		let reg = new RegExp(`^${item}`)
		if (reg.test(model) && is_multi_app_tmp) {
			if (!where?.system_system) {
				where.system_system = {
					_eq: default_system_system_tmp
				}
			}
		}
	})

	let args_string = "";
	if (typeof args == "object" && args && Object.keys(args).length > 0) {
		args_string = `args:${gql_string(args)}`;
	}
	let where_string = "";
	if (typeof where == "object" && where && Object.keys(where).length > 0) {
		where_string = `where:${gql_string(where)}`;
	};
	let order_by_string = "";
	if (typeof order_by == "object" && order_by && Object.keys(order_by).length > 0) {
		order_by_string = `order_by:${gql_string(order_by, 2)}`;
	};
	let distinct_on_string = "";
	if (typeof distinct_on == "string" && distinct_on) {
		distinct_on_string = `distinct_on:${distinct_on}`;
	};
	let offset_string = "";
	if (typeof offset == "number" && offset > 0) {
		offset_string = `offset:${offset}`;
	};
	let limit_string = "";
	if (typeof limit == "number" && limit > 0) {
		limit_string = `limit:${limit}`;
	}
	let fz_body_string = ""
	if (typeof fz_body !== "undefined") {
		if (typeof fz_body == "object" && fz_body) {
			fz_body_string = `fz_body:${gql_string(fz_body)}`;
		} else {
			fz_body_string = `fz_body:"${gql_string(fz_body,4)}"`;
		}
	}
	let params_string = ""
	if (typeof params == "object" && params && Object.keys(params).length > 0) {
		let tempStr = gql_string(params)
		params_string = `${tempStr.slice(1, tempStr.length - 1)}`;
	}

	let queryBody = "";
	let responseBodyAutoAttach = ""
	if (/operation_\w+/.test(model)) {
		if (params_string || fz_body_string) {
			queryBody = `(
			  ${params_string}
			  ${fz_body_string}
			) `
		}
	} else if (/\w+_by_pk/.test(model)) {
		if (typeof id != "undefined") {
			queryBody = `(
			  id:${id}
			) `
		}
	} else if (params_string) {
		queryBody = `(
		  ${params_string}
		) `
	} else {
		if (/\w+_aggregate/.test(model)) {
			responseBodyAutoAttach = ""
		} else {
			responseBodyAutoAttach = "id"
		}
		if (where_string || order_by_string || distinct_on_string || offset_string || limit_string || args_string) {
			queryBody = `(
			      ${where_string}
			      ${order_by_string}
			      ${distinct_on_string}
			      ${offset_string}
			      ${limit_string}
				  ${args_string}
			    ) `
		}
	}
	let queryResponse = "";
	if (field_string || responseBodyAutoAttach) {
		queryResponse = `{
			${responseBodyAutoAttach}
			${field_string}
		  }`;
	}
	response_body = `${response_key}: ${model} ${queryBody}${queryResponse}`
	gql = `query ${model} {
    ${response_body}
  }`
	return mode === 1 ? gql : (mode === 2 ? response_body : "");
}

// 获取跨表批处理gql
function get_batch_mutation_gql(list = []) {
	let response_body = ``;
	let gql = ``;
	list.forEach(item => {
		let response_key = item?.response_key || (item?.operation.replace(/[^\w]/g, ""))
		response_body += `${get_mutation_gql(item, 2, response_key)} `
	})
	gql = `mutation batch_mutation{
    ${response_body}
  }`;
	return gql;
}

function get_batch_query_gql(list = []) {
	let response_body = ``;
	let gql = ``;
	list.forEach(item => {
		let response_key = item?.response_key || (item?.model.replace(/[^\w]/g, ""))
		response_body += `${get_query_gql(item, 2, response_key)} `
	})
	gql = `query batch_query{
    ${response_body}
  }`;
	return gql;
}

async function file_reader_change(file, deal_name = "readAsArrayBuffer", deal_type = "readFile") {
	let fileRes = await (new Promise((resolve, reject) => {
		// 微信小程序的处理方法
		if (storeConfig?.env == "MP-WEIXIN") {
			wx.getFileSystemManager()[deal_type]({
				filePath: file.path,
				encoding: deal_name == "readAsText" ? "binary" : undefined,
				success: res => {
					let target = {
						result: res.data,
						digest: res.digest
					}
					resolve({
						target
					})
				},
				fail: err => {
					reject(err)
				}
			})
		} else if (storeConfig?.env == "H5") {
			// H5端处理方法
			let reader = new FileReader();
			reader.onload = (onload_info) => {
				resolve(onload_info)
			}
			reader.onerror = (onerror_info) => {
				reject(onerror_info)
			}
			//reader.readAsDataURL(file) // 返回一个基于Base64编码的data-uri对象
			//reader.readAsText(file) // 返回文本字符串。默认情况下，文本编码格式是’UTF-8’，可以通过可选的格式参数，指定其他编码格式的文本
			reader[deal_name](file) // 返回二进制字符串，该字符串每个字节包含一个0到255之间的整数
			//reader.readAsArrayBuffer(Blob|File)//返回一个ArrayBuffer对象
		}
	}))
	return {
		fileRes,
		result: fileRes.target.result,
		digest: fileRes.target.digest,
	}
}

async function get_local_uimage_gql(file) {
	let {
		result: rdRes
	} = await file_reader_change(file, "readAsArrayBuffer");


	let md5Base64, imageSuffix;

	if (storeConfig?.env == "MP-WEIXIN") {
		let {
			digest
		} = await file_reader_change(file, undefined, "getFileInfo");

		function hexToArrayBuffer(hexString) {
			// 将16进制字符串转成字节数组
			const byteArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function(h) {
				return parseInt(h, 16)
			}))
			// 将字节数组转成ArrayBuffer
			return byteArray.buffer
		}
		let digest_ArrayBuffer = hexToArrayBuffer(digest);
		md5Base64 = wx.arrayBufferToBase64(digest_ArrayBuffer);
		imageSuffix = file.path.slice(file.path.lastIndexOf(".") + 1).toUpperCase();

	} else if (storeConfig?.env == "H5") {
		let wordArray = CryptoJS.lib.WordArray.create(rdRes);
		md5Base64 = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(wordArray));
		imageSuffix = file.name.slice(file.name.lastIndexOf(".") + 1).toUpperCase();
	}

	let gql = `mutation ImagePresignedUrl {
	  response:imagePresignedUrl(imageSuffix: ${imageSuffix}, imgMd5Base64:"${md5Base64}") {
	    downloadUrl
	    uploadUrl
	    contentType
	    imageId
	  }
	}`
	return {
		gql,
		md5Base64,
		result: rdRes
	};
}
async function get_local_uvideo_gql(file) {
	let {
		result: rdRes
	} = await file_reader_change(file, "readAsArrayBuffer");


	let md5Base64, videoFormat;
	if (storeConfig?.env == "MP-WEIXIN") {
		let {
			digest
		} = await file_reader_change(file, undefined, "getFileInfo");

		function hexToArrayBuffer(hexString) {
			// 将16进制字符串转成字节数组
			const byteArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function(h) {
				return parseInt(h, 16)
			}))
			// 将字节数组转成ArrayBuffer
			return byteArray.buffer
		}
		let digest_ArrayBuffer = hexToArrayBuffer(digest);
		md5Base64 = wx.arrayBufferToBase64(digest_ArrayBuffer);
		videoFormat = file.path.slice(file.path.lastIndexOf(".") + 1).toUpperCase();
	} else if (storeConfig?.env == "H5") {
		let wordArray = CryptoJS.lib.WordArray.create(rdRes);
		md5Base64 = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(wordArray));
		videoFormat = file.name.slice(file.name.lastIndexOf(".") + 1).toUpperCase();
	}

	let gql = `mutation videoPresignedUrl {
	  response:videoPresignedUrl(videoFormat: ${videoFormat}, videoMd5Base64:"${md5Base64}") {
	    downloadUrl
	    uploadUrl
	    contentType
	    videoId
	  }
	}`
	return {
		gql,
		md5Base64,
		result: rdRes
	};
}
async function get_local_ufile_gql(file) {
	let {
		result: rdRes
	} = await file_reader_change(file, "readAsArrayBuffer");

	let md5Base64, suffix, name;

	if (storeConfig?.env == "MP-WEIXIN") {
		let {
			digest
		} = await file_reader_change(file, undefined, "getFileInfo");

		function hexToArrayBuffer(hexString) {
			// 将16进制字符串转成字节数组
			const byteArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function(h) {
				return parseInt(h, 16)
			}))
			// 将字节数组转成ArrayBuffer
			return byteArray.buffer
		}
		let digest_ArrayBuffer = hexToArrayBuffer(digest);
		md5Base64 = wx.arrayBufferToBase64(digest_ArrayBuffer);
		imageSuffix = file.path.slice(file.path.lastIndexOf(".") + 1).toUpperCase();
		name = file.name || "no-name";

	} else if (storeConfig?.env == "H5") {
		let wordArray = CryptoJS.lib.WordArray.create(rdRes);
		md5Base64 = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(wordArray));
		imageSuffix = file.name.slice(file.name.lastIndexOf(".") + 1).toUpperCase();
		name = file.name

	}
	let format = suffix;
	let gql = `mutation FilePresignedUrl {
	  response:filePresignedUrl(
	    name: "${name}"
	    md5Base64: "${md5Base64}"
	    format: ${format}
	    suffix: "${suffix}"
	  ) {
	    downloadUrl
	    uploadUrl
	    contentType
	    fileId
	  }
	}`
	return {
		gql,
		md5Base64,
		result: rdRes
	};
}
// mode=1,仅仅将对象的键的引号替换掉，mode=2，将键和值的引号全部替换掉,默认为模式1，mode=3专门针对带有on_conflict属性的对象进行的替换
function gql_string(obj, mode = 1) {
	if (mode === 1) {
		return JSON.stringify(obj).replace(/"(\w+?)":/g, "$1:");
	} else if (mode === 2) {
		return JSON.stringify(obj).replace(/"/g, "");
	} else if (mode === 3) {
		return JSON.stringify(obj).replace(/"(\w+?)":/g, "$1:").replace(
			/([,\{])update_columns:"([\w,\[\]]+)"([,\}])/g, "$1update_columns:$2$3").replace(
			/([,\{])constraint:"([\w,\[\]]+)"([,\}])/g, "$1constraint:$2$3")
	} else if (mode === 4) {
		return obj.replace(/\\/g, "\\\\").replace(/\r\n/g, "\\n").replace(/\"/g, "\\\"").replace(/\n/g, "\\n");
	}
}

// 封装请求函数,这里的请求默认是在uniapp环境
async function request(options) {
	process.env.NODE_ENV !== 'production' && console.log("%crequest发起请求传入options：", "color: #20b9be", options);
	return await new Promise((resolve, reject) => {
		if (storeConfig?.env == "MP-WEIXIN") {
			wx.request(options).then(res => {
				resolve(res.data)
			}).catch(e => {
				reject(e)
			})
		} else if (storeConfig?.env == "H5") {
			fetch(options.url, {
				method: options?.method,
				body: JSON.stringify(options?.data),
				headers: {
					...options?.header,
					'Content-Type': 'application/json'
				},
			}).then(res => {
				resolve(res.json())
			}).catch(e => {
				reject(e)
			});
		}
	})
}

// zion本地上传到阿里云，支持多种类型媒体
async function ali_umedia(file, attach) {
	if (storeConfig?.env == "MP-WEIXIN") {
		if (!file?.path) {
			throw "file.path必须传入"
		}
	}
	let variables = {}
	let {
		url,
		header_authorization,
		type
	} = attach

	let todoRes;
	switch (type) {
		case "uvideo":
			todoRes = get_local_uvideo_gql(file);
			break;
		case "uimage":
			todoRes = get_local_uimage_gql(file);
			break;
		case "ufile":
			todoRes = get_local_ufile_gql(file);
			break;
		default:
			throw `不支持的type:${type}`
			break;
	}
	let {
		gql,
		md5Base64,
		result
	} = await todoRes;

	let response = await request({
		url: url || storeConfig?.gql_apiUrl,
		header: {
			authorization: header_authorization || storeConfig?.gql_authorization
		},
		method: "POST",

		data: {
			variables,
			query: gql,
		}
	}).then(res => {
		let response = res?.data?.response
		if (!response) {
			throw res
		} else {
			return response
		}
	})
	// 上传图片到服务器
	if (storeConfig?.env == "H5") {
		let mediaResult = await fetch(response.uploadUrl, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': response.contentType,
				'Content-MD5': md5Base64,
			},
		});
		return mediaResult?.status === 200 ? response : {};
	}

	return await request({
		url: response.uploadUrl,
		data: result,
		method: "PUT",
		header: {
			'Content-Type': response.contentType,
			'Content-MD5': md5Base64,
		}
	}).then(res => response)
}


//storeConfig初始化
 function storeConfig_init(gql_apiUrl,actionflow_id) {
	
	storeConfig.gql_apiUrl = gql_apiUrl
	storeConfig.actionflowmain_id = actionflow_id
	    
	
}
 


export default {
	// request is the native request method
	request: async (options, url = "", header_authorization = "") => {
		let variables = options?.variables || {};
		let gql = options?.query;
		if (gql !== undefined) {
			return await request({
				url: url || storeConfig?.gql_apiUrl,
				header: {
					authorization: header_authorization || storeConfig?.gql_authorization
				},
				method: "POST",
				data: {
					variables,
					query: gql,
				}
			}).then(res => {
				let data = res?.data
				if (!data) {
					throw res
				} else {
					return data
				}
			})
		} else {
			return await request(options)
		}
	},

	// mutation is commonly used in addition, deletion and modification operations
	mutation: async (data, url = "", header_authorization = "") => {
		let variables = {}
		let gql = get_mutation_gql(data)
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let response = res?.data?.response
			if (!response) {
				throw res
			} else {
				return response
			}
		})
	},

	// query is commonly used for query operations
	query: async (data, url = "", header_authorization = "") => {
		let variables = {}
		let gql = get_query_gql(data)
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let response = res?.data?.response
			if (!response) {
				throw res
			} else {
				return response
			}
		})
	},

	/**
	 * gql_debug This command is used to query and debug gql statements,
	 * which are similar to database operation statements
		gql is similar to this statement in mysql
		MySQL  select * from xxx;
	 */
	gql_debug: async (data, url = "", header_authorization = "") => {
		let variables = {}
		let gql = get_gql_debug_gql(data.jsCode, data.args)
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let response = res?.data?.response
			if (!response) {
				throw res
			} else {
				return response
			}
		})
	},

	//batch_mutation Batch operations, such as batch add, batch delete, batch update
	batch_mutation: async (list, url = "", header_authorization = "") => {
		let variables = {}
		let gql = get_batch_mutation_gql(list)
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let data = res?.data
			if (!data) {
				throw res
			} else {
				return data
			}
		})
	},

	//batch_query means batch query
	batch_query: async (list, url = "", header_authorization = "") => {
		let variables = {}
		let gql = get_batch_query_gql(list)
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let data = res?.data
			if (!data) {
				throw res
			} else {
				return data
			}
		})
	},


	// 调用自定义行为
	//callActionflow is difficult, it calls custom actions in the zion platform
	callActionflow: async (args, url = "", header_authorization = "") => {
		// 调用自定义行为
		let variables = {
			actionflowId: args?.actionflowId || storeConfig?.actionflowmain_id,
			actionflow_name: args?.actionflow_name,
			payload: args?.payload
		}
		if (!variables?.payload) {
			variables.payload = {
				token: storeConfig?.token
			}
		} else if (!variables?.payload?.token) {
			variables.payload.token = storeConfig?.token
		}

		let gql =
			"mutation fz_action_code($actionflowId:String! $actionflow_name:String! $payload:JsonObject){response:fz_invoke_action_code(testPassword:\"doushizhutou3\" args:{actionflowId:$actionflowId actionflow_name:$actionflow_name payload:$payload}jsCode:\"let actionflow_name=context.getArg(\\\"actionflow_name\\\");let payload = context.getArg(\\\"payload\\\");let actionflowId = context.getArg(\\\"actionflowId\\\"); let {status,msg,data} = context.callActionFlow(actionflowId,null,{actionflow_name,payload});context.setReturn(\\\"status\\\",status);context.setReturn(\\\"msg\\\",msg);context.setReturn(\\\"data\\\",data);\" updateDb:true accountId:1000000000000001)}";
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let response = res?.data?.response
			if (!response) {
				throw res
			} else {
				return response
			}
		})
	},

	//local_uimage uploads the local image to the database
	local_uimage: async (fileObj, url = "", header_authorization = "") => {
		// 本地上传，上传图片
		return await ali_umedia(fileObj, {
			type: "uimage",
			url,
			header_authorization
		});
	},

	//local_ufile is to upload the file to the database
	local_ufile: async (fileObj, url = "", header_authorization = "") => {
		// 本地上传，上传文件
		return await ali_umedia(fileObj, {
			type: "ufile",
			url,
			header_authorization
		});
	},

	//local_uvideo Uploads the video to the database
	local_uvideo: async (fileObj, url = "", header_authorization = "") => {
		// 本地上传，上传视频
		return await ali_umedia(fileObj, {
			type: "uvideo",
			url,
			header_authorization
		});
	},


	/**
	 * local_umedia uploads images or files linked to the public network to the database
		Similar to the file you download from a vpn set up by a friend,
		that file should also be a link that automatically downloads after you punch in,
		The link is actually a file
	 */
	local_umedia: async (media_url, url = "", header_authorization = "") => {
		// 本地上传，公网链接上传
		let variables = {}
		let gql = get_mutation_gql({
			operation: `umedia_${media_url}`,
		})
		return await request({
			url: url || storeConfig?.gql_apiUrl,
			header: {
				authorization: header_authorization || storeConfig?.gql_authorization
			},
			method: "POST",
			data: {
				variables,
				query: gql,
			}
		}).then(res => {
			let response = res?.data?.response?.umedia_result
			if (!response) {
				throw res
			} else {
				return response
			}
		})
	},

	
	storeConfig_init


}
