var OFFLINE_DATABASE_CONFIGURATION = {
    "Name": "%%TOK|ROUTE|OfflineDatabase|DatabaseInstanceName%%",
    "Version": "%%TOK|ROUTE|OfflineDatabase|DatabaseVersionNo%%",
    "DefaultSize": "%%TOK|ROUTE|OfflineDatabase|DatabaseDefaultSize%%",
    "LocalStorageNamePrimaryKey": "_PrimaryID"
};

var PRIVATE_DB = new PouchDB(OFFLINE_DATABASE_CONFIGURATION.Name, { size: OFFLINE_DATABASE_CONFIGURATION.DefaultSize });
var PRIVATE_OFFLINE_MANAGER = null; //NOTE: lazy load and intialized on module.html page load (based on web config settings)

var OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE = "m_mod";

var enCOfflineFilterFunctionType = {
    "None": 0,
    "Invalid": -100,

    "Default": 2,
    "Identifier": 10,
    "IdentifierNullable": 12,
    "TriState": 20,
    "TextSearch": 30,
    "Date": 40,
    "DateRange": 42,

    "Regex": 50,
    "RegexContains": 60,

    "In": 70,
    "NotIn": 72,
    "LessThan": 74
};

function CQuery(options) {

    var _instance = this;

    options = util_extend({ "Parameters": null }, options);

    _instance["Parameters"] = util_extend({}, options.Parameters);

    var _fnGetParam = function (prop) {
        return (prop ? _instance.Parameters[prop] : undefined);
    };

    var _temp = {

        "m_filters": {},

        "IndexName": null,
        "Fields": null,
        "DisableResultWrapper": true,

        "_unbox": true,
        "IsResultSingle": false,
        "InstanceType": null,
        "OnPostProcessResultData": function (data) { },

        "PageNum": enCEPaging.NoPaging,
        "PageSize": enCEPaging.NoPaging,
        "SortASC": true,

        "Reset": function () {
            this.m_filters = {};
            this.IndexName = null;
            this.Fields = null;

            this.IsResultSingle = false;
            this.InstanceType = null;
            this.OnPostProcessResultData = function (data) { };

            this.PageNum = enCEPaging.NoPaging;
            this.PageSize = enCEPaging.NoPaging;
            this.SortASC = true;
        },

        "Filter": function (fieldName, opts, propParameter, overrideOpts) {

            if (propParameter) {

                if ($.isArray(propParameter)) {
                    var _arrValue = [];

                    for (var p = 0; p < propParameter.length; p++) {
                        _arrValue.push(_fnGetParam(propParameter[p]));
                    }

                    opts["SearchValue"] = _arrValue;
                }
                else {
                    opts["SearchValue"] = _fnGetParam(propParameter);
                }
            }
            else {
                overrideOpts = util_extend({ "v": null }, overrideOpts);

                opts["SearchValue"] = overrideOpts.v;
            }

            this.m_filters[fieldName] = opts;
        },

        "FilterNameSearch": function (prop, paramNameMatch, paramNameSearch) {

            //Name or Search
            //NOTE: since both the Name filter and Search filter use the same property, only one filter can be applied
            var _name = util_forceString(_fnGetParam(paramNameMatch));
            var _search = util_forceString(_fnGetParam(paramNameSearch));

            if (paramNameMatch && _name != "" && _search == "") {
                this.Filter(prop, { "Type": enCOfflineFilterFunctionType.TextSearch }, paramNameMatch);
            }
            else if (paramNameSearch && _name == "" && _search != "") {
                this.Filter(prop, { "Type": enCOfflineFilterFunctionType.RegexContains }, paramNameSearch);
            }
            else if (paramNameMatch && paramNameSearch && _name != "" && _search != "") {
                this.Filter(prop, { "Type": enCOfflineFilterFunctionType.Invalid }, null);
            }

        },

        "InitIndexName": function (indexPrefixName, enumPropertyColumn, paramNameSort, enumSortColumn, defaultSortValue, arrSupportedColumns) {

            var _sortColumn = defaultSortValue;

            if (paramNameSort && enumSortColumn) {
                _sortColumn = util_forceValidEnum(_fnGetParam(paramNameSort), enumSortColumn, defaultSortValue, true);
            }

            var _found = false;

            arrSupportedColumns = (arrSupportedColumns || []);

            for (var c = 0; c < arrSupportedColumns.length && !_found; c++) {

                if (_sortColumn == arrSupportedColumns[c]) {
                    _found = true;
                    break;
                }
            }

            if (!_found) {
                _sortColumn = defaultSortValue;
            }

            var _name = util_enumNameLookup(_sortColumn, enumSortColumn);

            this.IndexName = indexPrefixName + enumPropertyColumn[_name];
        },

        "InitPaging": function (propSortASC, propPageSize, propPageNum) {

            if (!propSortASC) {
                propSortASC = "SortAscending";
            }

            if (!propPageSize) {
                propPageSize = "PageSize";
            }

            if (!propPageNum) {
                propPageNum = "PageNum";
            }

            this.SortASC = util_forceBool(options.Parameters[propSortASC], this.SortASC);
            this.PageNum = util_forceInt(options.Parameters[propPageNum], this.PageNum);
            this.PageSize = util_forceInt(options.Parameters[propPageSize], this.PageSize);
        },

        "Execute": function (onExecuteCallback) {

            var _this = this;

            PRIVATE_OFFLINE_MANAGER.Select({
                "_index": _this.IndexName,
                "Fields": _this.Fields,
                "Filters": _this.m_filters,
                "SortASC": _this.SortASC, "PageNum": _this.PageNum, "PageSize": _this.PageSize,
                "OnSuccess": function (data) {
                    var _result = data;
                    var _unbox = _this["_unbox"];

                    if (_this.IsResultSingle) {

                        var _list = (_result.Data ? _result.Data.List : null);

                        _list = (_list || []);

                        if (_list.length != 1) {
                            _result.Data = (_this.InstanceType ? (new _this.InstanceType()) : null);
                            _this.OnPostProcessResultData(_result.Data);
                        }
                        else {
                            _result.Data = _list[0];
                        }

                        if (_unbox) {
                            _result = _result.Data;
                        }
                    }
                    else if (_unbox) {

                        var _list = (_result.Data ? _result.Data.List : null);

                        _result = (_list || []);
                    }

                    onExecuteCallback(_result);
                }
            });

        }   //end: Execute
    };

    util_extend(this, _temp, true, true);
}

function CBusinessServiceBase(options) {
    var _instance = this;

    options = util_extend({
        "EntityType": null,
        "PropertyPrimaryKey": null,
        "GetByPrimaryKey": null,
        "GetDeepSaveDeleteList": null, "GetDeepSaveUpdateList": null, "SetDeepSaveUpdateList": null,
        "GetDeleteForeignDataList": null,

        //used to perform deep save cleanup of list context
        "PreSaveAction": null,  //configuration object of: {"IndexName"}    //NOTE: uses target PropertyPrimaryKey so only index name required

        //foreign key/property actions
        "Actions": null //array of items of: {"Type", "IndexName", "ListProperty", "ForeignKeyProperty", "PrimaryKeyProperty"}
    }, options);

    _instance["Config"] = options;
    _instance["Query"] = new CQuery();
    _instance["Utils"] = {
        "IsEntityType": function(val, typeName) {
            return PRIVATE_OFFLINE_MANAGER.Utils.IsEntityType(val, typeName);
        },
        "ExtendEntity": function(val, entityType) {
            return PRIVATE_OFFLINE_MANAGER.Utils.ExtendEntity(val, entityType);
        },
        "ForceEntityType": function (val, entityType, opts) {
            return PRIVATE_OFFLINE_MANAGER.Utils.ForceEntityType(val, entityType, opts);
        }
    };
}

CBusinessServiceBase.prototype.Save = function (options) {

    options = util_extend({ "IsAddNew": null, "DeepSave": false, "Item": null, "OnSuccess": null, "OnError": null }, options);

    var _instance = this;
    var _queue = new CEventQueue();

    var _item = options.Item;
    var _preUpdate = null;

    var _isAddNew = options.IsAddNew;
    var _deepSave = util_forceBool(options.DeepSave, false);
    var _config = (this.Config || {});

    options.OnError = (options.OnError || function () { });

    if (_isAddNew === null && _config.PropertyPrimaryKey) {
        _isAddNew = (util_forceInt(_item[_config.PropertyPrimaryKey], enCE.None) == enCE.None);
    }

    if (_deepSave && !_isAddNew && _config.GetByPrimaryKey) {
        var _id = undefined;

        _id = (_config.PropertyPrimaryKey ? _item[_config.PropertyPrimaryKey] : _id);

        _queue.Add(function (onCallback) {

            _config.GetByPrimaryKey({
                "Instance": _instance, "Query": _instance.Query, "ID": _id, "Item": _item, "Callback": function (data) {
                    _preUpdate = (data || {});
                    onCallback();
                }
            });
        });

        //remove all dependent data no longer applicable
        if (_config.GetDeepSaveDeleteList) {

            _queue.Add(function (onCallback) {

                _config.GetDeepSaveDeleteList({
                    "Instance": _instance, "Item": _item, "PreUpdateItem": _preUpdate, "Callback": function (deleteList) {

                        deleteList = (deleteList || []);

                        if (deleteList.length > 0) {
                            PRIVATE_OFFLINE_MANAGER.Delete(deleteList, { "OnSuccess": onCallback });
                        }
                        else {
                            onCallback();
                        }
                    }
                });

            });
        }
    }

    _queue.Add(function (onCallback) {

        if (_isAddNew) {
            if (_config.PropertyPrimaryKey) {
                _item[_config.PropertyPrimaryKey] = PRIVATE_OFFLINE_MANAGER.Configuration.NextUniqueID();
            }
        }

        _instance.BaseSave({
            "Instance": _instance, "Data": _item, "OnSuccess": function (saveItem) {
                _item = (saveItem ? saveItem.Result : null);
                onCallback();
            },
            "OnError": function (err) {
                options.OnError(err);
                //do not perform callback for queue since want to exit
            }
        });
    });

    if (_deepSave && _config.GetDeepSaveUpdateList) {
        _queue.Add(function (onCallback) {

            var _id = undefined;

            _id = (_config.PropertyPrimaryKey ? _item[_config.PropertyPrimaryKey] : _id);

            _config.GetDeepSaveUpdateList({
                "Instance": _instance, "ID": _id, "Item": _item, "Callback": function (updateList) {

                    updateList = (updateList || []);

                    if (updateList.length > 0) {
                        PRIVATE_OFFLINE_MANAGER.Update(updateList, {
                            "OnSuccess": function (saveResult) {

                                var _list = (saveResult && saveResult.Data ? saveResult.Data.List : null);

                                if (_config.SetDeepSaveUpdateList) {
                                    _config.SetDeepSaveUpdateList({ "Item": _item, "List": _list, "Callback": onCallback });
                                }
                                else {
                                    onCallback();
                                }
                            },
                            "OnError": options.OnError
                        });
                    }
                    else {
                        onCallback();
                    }
                }
            });
        });
    }

    _queue.Run({
        "Callback": function () {
            options.OnSuccess(_item);
        }
    });
};

CBusinessServiceBase.prototype.SaveList = function (options) {

    options = util_extend({ "List": null, "DeepSave": false, "OnSuccess": null, "OnError": null, "OnInitListItem": null, "PreSavePrimaryKeyValue": null }, options);

    options.OnSuccess = (options.OnSuccess || function () { });
    options.OnError = (options.OnError || function () { });

    var _instance = this;
    var _config = (_instance.Config || {});

    if (!_config.PropertyPrimaryKey) {
        var _err = "SaveList :: instance argument exception - PropertyPrimaryKey is required.";

        util_logError(_err);
        options.OnError(_err);
        return;
    }

    //check whether the primary key is an array (i.e. composite primary key)
    var _isCompositePrimaryKey = $.isArray(_config.PropertyPrimaryKey);

    var _queue = new CEventQueue();
    var _result = { "valid": true, "err": null, "list": [] };

    var _items = (options.List || []);
    var _deepSave = util_forceBool(options.DeepSave, false);
    var _hasEntityType = (_config.EntityType ? true : false);

    var _actions = {
        "ListUpdateID": [],
        "ListAddNewID": [],

        "AddEditID": function (id, isAddNew) {
            var _arr = (isAddNew ? this.ListAddNewID : this.ListUpdateID);

            _arr.push(id);
        },

        "GetCompositeKey": function (item, arrProps) {
            var _strID = "";

            for (var p = 0; p < arrProps.length; p++) {
                var _prop = arrProps[p];

                _strID += (p > 0 ? "_" : "") + util_forceInt(item[_prop], enCE.None);
            }

            return _strID;
        },

        "HasRevision": function (item) {
            var _rev = (item ? item["_rev"] : null);

            return (_rev !== null && _rev !== undefined);
        }
    };

    for (var i = 0; i < _items.length; i++) {
        var _item = _items[i];
        var _isAddNew = false;

        if (_isCompositePrimaryKey) {

            //new item is being entered if it does not have a revision property (since cannot check composite primary keys as they are not seed identity)
            _isAddNew = (_actions.HasRevision(_item) == false);
        }
        else {
            _isAddNew = (util_forceInt(_item[_config.PropertyPrimaryKey], enCE.None) == enCE.None);

            if (_isAddNew) {
                _item[_config.PropertyPrimaryKey] = PRIVATE_OFFLINE_MANAGER.Configuration.NextUniqueID();
            }

            if (_deepSave) {
                _actions.AddEditID(_item[_config.PropertyPrimaryKey], _isAddNew);
            }
        }

        if (_hasEntityType) {
            _item = _instance.Utils.ForceEntityType(_item, _config.EntityType);
            _items[i] = _item;
        }

        if (options.OnInitListItem) {
            options.OnInitListItem.apply(this, [{ "Item": _item, "IsAddNew": _isAddNew }]);
        }

        //NOTE: important that for composite primary key that the edit ID is tracked after the list item has been initialized
        //      (in case the list item requires necessary primary key properties to be configured before generating a string version)
        if (_isCompositePrimaryKey && _deepSave) {
            _actions.AddEditID(_actions.GetCompositeKey(_item, _config.PropertyPrimaryKey), _isAddNew);
        }
    }

    if (_deepSave && _config.PreSaveAction && options.PreSavePrimaryKeyValue) {

        var _preSaveAction = util_extend({ "IndexName": null }, _config.PreSaveAction);

        if (util_forceString(_preSaveAction.IndexName) != "") {

            _queue.Add(function (onCallback) {

                var _query = _instance.Query;
                var _isValidQuery = true;

                _query.Reset();

                _query.IndexName = _preSaveAction.IndexName;

                //get smaller dataset result of ID, revision, and primary key property
                _query.Fields = ["_id", "_rev"];

                if (_isCompositePrimaryKey) {
                    $.merge(_query.Fields, _config.PropertyPrimaryKey);
                }
                else {
                    _query.Fields.push(_config.PropertyPrimaryKey);
                }

                //apply filter of items based on provided save argument for the primary key
                if (_isCompositePrimaryKey) {

                    //required format of lookup with property (which should be limited to match one of primary key from config) and value of ID (forced numeric)
                    options.PreSavePrimaryKeyValue = util_extend({}, options.PreSavePrimaryKeyValue);

                    _isValidQuery = false;  //default validation check value

                    for (var i = 0; i < _config.PropertyPrimaryKey.length; i++) {
                        var _prop = _config.PropertyPrimaryKey[i];

                        if (options.PreSavePrimaryKeyValue[_prop]) {
                            var _id = util_forceInt(options.PreSavePrimaryKeyValue[_prop], enCE.None);

                            _isValidQuery = (_isValidQuery || (_id != enCE.None));

                            _query.Filter(_prop, { "Type": enCOfflineFilterFunctionType.Default }, null, { "v": _id });
                        }
                    }
                }
                else {
                    var _id = util_forceInt(options.PreSavePrimaryKeyValue, enCE.None);

                    _query.Filter(_config.PropertyPrimaryKey, { "Type": enCOfflineFilterFunctionType.Default }, null, { "v": _id });

                    _isValidQuery = (_id != enCE.None);
                }

                if (!_isValidQuery) {
                    var _err = "SaveList :: pre-save argument specified for deep save is invalid or not properly configured.";

                    util_logError(_err);
                    options.OnError(_err);
                    return; //exit queue
                }

                _query.Execute(function (existDataList) {

                    if (existDataList && existDataList.length > 0) {

                        //get list of existing items that are not part of the current save list (which will be deleted by checking the primary key)
                        var _lookupSaveListID = {};

                        var _temp = [];

                        $.merge(_temp, _actions.ListAddNewID);
                        $.merge(_temp, _actions.ListUpdateID);

                        for (var i = 0; i < _temp.length; i++) {
                            var _id = _temp[i];

                            _lookupSaveListID[_id] = true;
                        }

                        existDataList = util_arrFilterSubset(existDataList, function (searchItem) {
                            var _id = (_isCompositePrimaryKey ? _actions.GetCompositeKey(searchItem, _config.PropertyPrimaryKey) :
                                                                searchItem[_config.PropertyPrimaryKey]);

                            return !_lookupSaveListID[_id];
                        });
                    }

                    if (existDataList && existDataList.length > 0) {

                        //delete the filtered previous items no longer applicable based on the save list of items
                        PRIVATE_OFFLINE_MANAGER.Delete(existDataList, { "OnSuccess": onCallback });
                    }
                    else {
                        onCallback();
                    }

                });

            });
        }
    }

    //save the base list items (if there are entries available)
    if (_items.length > 0) {

        _queue.Add(function (onCallback) {

            _instance.BaseSave({
                "Instance": _instance, "Data": _items, "OnSuccess": function (saveData) {
                    $.merge(_result.list, saveData ? saveData["Result"] : null);
                    onCallback();
                },
                "OnError": function (err) {
                    options.OnError(err);
                    //do not perform callback for queue since want to exit
                }
            });
        });
    }

    if (_deepSave && _config["Actions"] && _config.Actions.length > 0) {

        var _fnIsValidPropertyKey = function (val) {
            var _valid = false;

            if (typeof val === "string") {
                _valid = (util_forceString(val) != "");
            }
            else if ($.isArray(val)) {
                _valid = (val.length > 0);
            }

            return _valid;

        };  //end: _fnIsValidPropertyKey

        for (var a = 0; a < _config.Actions.length; a++) {

            (function () {
                var _foreignAction = util_extend({ "Type": null, "IndexName": null, "ListProperty": null, "ForeignKeyProperty": null, "PrimaryKeyProperty": null }, _config.Actions[a]);

                if (_foreignAction.Type &&
                    (util_forceString(_foreignAction.ListProperty) != "") && _fnIsValidPropertyKey(_foreignAction.ForeignKeyProperty) &&
                     _fnIsValidPropertyKey(_foreignAction.PrimaryKeyProperty)  && (util_forceString(_foreignAction.IndexName) != "")
                   ) {

                    var _lookupForeignList = {};
                    var _saveForeignDataList = [];

                    var _isForeignComposite_PrimaryKeyProperty = $.isArray(_foreignAction.PrimaryKeyProperty);
                    var _isForeignComposite_ForeignKeyProperty = $.isArray(_foreignAction.ForeignKeyProperty);

                    //load the foreign list (for updated items) and perform cleanup of items no longer applicable
                    _queue.Add(function (onCallback) {

                        var _saveItems = _result.list;

                        //initialize the list of IDs (update/deleted items)
                        var _filterParentIDs = null;
                        var _trackExcludeID = true;

                        if (_isCompositePrimaryKey) {

                            _filterParentIDs = {};  //construct lookup using each key in the composite primary key

                            var _temp = [];

                            $.merge(_temp, _actions.ListUpdateID);

                            _trackExcludeID = (_temp.length > 0);

                            for (var i = 0; i < _temp.length; i++) {
                                var _strID = _temp[i];
                                var _arrPropValueID = _strID.split("_");

                                for (var p = 0; p < _config.PropertyPrimaryKey.length; p++) {
                                    var _prop = _config.PropertyPrimaryKey[p];
                                    var _propLookup = _filterParentIDs[_prop];

                                    if (!_propLookup) {
                                        _propLookup = {};
                                        _filterParentIDs[_prop] = _propLookup;
                                    }

                                    var _pID = _arrPropValueID[p];

                                    _propLookup[_pID] = true;
                                }
                            }
                        }
                        else {

                            _filterParentIDs = [];
                            $.merge(_filterParentIDs, _actions.ListUpdateID);

                            _trackExcludeID = (_filterParentIDs.length > 0);
                        }

                        //construct the foreign list of items to be saved
                        var _arrExcludeForeignID = [];

                        for (var i = 0; i < _saveItems.length; i++) {
                            var _saveItem = _saveItems[i];
                            var _itemID = (_isCompositePrimaryKey ? _actions.GetCompositeKey(_saveItem, _config.PropertyPrimaryKey) :  
                                                                    _saveItem[_config.PropertyPrimaryKey]);

                            var _foreignList = _saveItem[_foreignAction.ListProperty];

                            if (_foreignList && _foreignList.length > 0) {

                                var _lookupForeignID = {};

                                for (var j = 0; j < _foreignList.length; j++) {
                                    var _foreignItem = _foreignList[j];
                                    var _foreignItemID = (_isForeignComposite_PrimaryKeyProperty ? _actions.GetCompositeKey(_foreignItem, _foreignAction.PrimaryKeyProperty) :
                                                                                                   util_forceInt(_foreignItem[_foreignAction.PrimaryKeyProperty], enCE.None));

                                    _foreignItem = _instance.Utils.ForceEntityType(_foreignItem, _foreignAction.Type);
                                    _foreignList[j] = _foreignItem;

                                    if (!_isForeignComposite_PrimaryKeyProperty && _foreignItemID == enCE.None) {
                                        _foreignItemID = PRIVATE_OFFLINE_MANAGER.Configuration.NextUniqueID();
                                        _foreignItem[_foreignAction.PrimaryKeyProperty] = _foreignItemID;
                                    }
                                    else if (_trackExcludeID &&
                                             (!_isForeignComposite_PrimaryKeyProperty || (_isForeignComposite_PrimaryKeyProperty && _actions.HasRevision(_foreignItem)))
                                            ) {

                                        //add the current foreign item to be excluded for retrieving the list of existing items
                                        _arrExcludeForeignID.push(_foreignItemID);
                                    }

                                    _lookupForeignID[_foreignItemID] = true;

                                    if (_isForeignComposite_ForeignKeyProperty) {

                                        //loop through the foreign primary key columns and map from the parent to the child
                                        for (var fp = 0; fp < _foreignAction.ForeignKeyProperty.length; fp++) {
                                            var _fDef = _foreignAction.ForeignKeyProperty[fp];

                                            if (_fDef["p"] && _fDef["ref"]) {

                                                //get the value from the parent property and set it for the child
                                                var _parentPropID = _saveItem[_fDef.ref];
                                                
                                                _foreignItem[_fDef.p] = _parentPropID;
                                            }
                                        }
                                    }
                                    else {
                                        _foreignItem[_foreignAction.ForeignKeyProperty] = _itemID;    //set the foreign ID (i.e. the parent ID value) for the child
                                    }
                                }

                                _lookupForeignList[_itemID] = { "ParentItem": _saveItem, "ForeignLookup": _lookupForeignID };

                                $.merge(_saveForeignDataList, _foreignList);
                            }
                        }

                        var _hasParentIDs = false;

                        if (_isCompositePrimaryKey) {

                            if (_filterParentIDs) {

                                //check if parent filter IDs exist from the lookup (exit loop as soon as possible when an entry is found)
                                for (var _key in _filterParentIDs) {

                                    if (_filterParentIDs[_key]) {

                                        for (var _propID in _filterParentIDs[_key]) {
                                            _hasParentIDs = true;
                                            break;
                                        }

                                        break;
                                    }

                                    if (_hasParentIDs) {
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            _hasParentIDs = (_filterParentIDs.length > 0);
                        }

                        if (_hasParentIDs) {

                            var _query = _instance.Query;

                            _query.Reset();
                            _query.IndexName = _foreignAction.IndexName;

                            //get smaller dataset result of ID, revision, and primary key property
                            _query.Fields = ["_id", "_rev"];

                            if (_isForeignComposite_ForeignKeyProperty) {

                                var _handledFields = {};

                                if (_isForeignComposite_PrimaryKeyProperty) {
                                    for (var i = 0; i < _foreignAction.PrimaryKeyProperty.length; i++) {
                                        var _prop = _foreignAction.PrimaryKeyProperty[i];

                                        if (!_handledFields[_prop]) {
                                            _query.Fields.push(_prop);
                                            _handledFields[_prop] = true;
                                        }
                                    }
                                }

                                for (var i = 0; i < _foreignAction.ForeignKeyProperty.length; i++) {
                                    var _fDef = _foreignAction.ForeignKeyProperty[i];

                                    if (_fDef["p"] && !_handledFields[_fDef.p]) {
                                        _query.Fields.push(_fDef.p);
                                        _handledFields[_fDef.p] = true;
                                    }

                                    if (_fDef["p"] && _fDef["ref"]) {

                                        //get all foreign items that are currently associated to a parent item
                                        var _restrictPropIDs = [];
                                        var _lookupPropIDs = _filterParentIDs[_fDef.ref];

                                        for (var _keyID in _lookupPropIDs) {
                                            var _id = util_forceInt(_keyID, enCE.None); //important! must force to numeric ID from string value (required for database filter match)

                                            if (_id != enCE.None) {
                                                _restrictPropIDs.push(_id);
                                            }
                                        }

                                        _query.Filter(_fDef["p"], { "Type": enCOfflineFilterFunctionType.In }, null, { "v": _restrictPropIDs });
                                    }
                                }
                            }
                            else {

                                //get all foreign items that are currently associated to a parent item
                                _query.Fields.push(_foreignAction.ForeignKeyProperty);

                                _query.Filter(_foreignAction.ForeignKeyProperty, { "Type": enCOfflineFilterFunctionType.In }, null, { "v": _filterParentIDs });

                                //exclude all foreign items that are to be saved (i.e. exists within the child list of a parent item being saved)
                                _query.Filter(_foreignAction.PrimaryKeyProperty, { "Type": enCOfflineFilterFunctionType.NotIn }, null, { "v": _arrExcludeForeignID });
                            }

                            _query.Execute(function (foreignDataItems) {

                                if (_isForeignComposite_PrimaryKeyProperty && foreignDataItems && foreignDataItems.length > 0) {

                                    //filter by excluding items from the list that are currently part of the foreign list to be saved (using foreign primary keys)
                                    var _lookupSaveCompositeID = {};

                                    //construct lookup of composite ID that should be excluded from the delete list
                                    if (_saveForeignDataList) {
                                        for (var i = 0; i < _saveForeignDataList.length; i++) {
                                            var _foreignItem = _saveForeignDataList[i];
                                            var _id = _actions.GetCompositeKey(_foreignItem, _foreignAction.PrimaryKeyProperty);

                                            _lookupSaveCompositeID[_id] = true;
                                        }
                                    }

                                    foreignDataItems = util_arrFilterSubset(foreignDataItems, function (searchItem) {

                                        var _searchID = _actions.GetCompositeKey(searchItem, _foreignAction.PrimaryKeyProperty);

                                        return !_lookupSaveCompositeID[_searchID];
                                    });
                                }

                                if (foreignDataItems && foreignDataItems.length > 0) {
                                    
                                    //delete the foreign list items not currently being referenced as a child within the save list parent items
                                    PRIVATE_OFFLINE_MANAGER.Delete(foreignDataItems, { "OnSuccess": onCallback });
                                }
                                else {
                                    onCallback();
                                }
                            });
                        }
                        else {
                            onCallback();
                        }
                    });

                    //save the foreign list items
                    _queue.Add(function (onCallback) {

                        var _saveItems = _result.list;

                        if (_saveForeignDataList.length > 0) {

                            _instance.BaseSave({
                                "Instance": _instance, "Data": _saveForeignDataList, "OnSuccess": function (saveData) {

                                    var _resultForeignList = (saveData ? saveData["Result"] : null);

                                    _resultForeignList = (_resultForeignList || []);

                                    var _lookupResult = {};

                                    //construct lookup of the saved foreign items using its primary key
                                    for (var i = 0; i < _resultForeignList.length; i++) {
                                        var _item = _resultForeignList[i];
                                        var _id = (_isForeignComposite_PrimaryKeyProperty ?
                                                   _actions.GetCompositeKey(_item, _foreignAction.PrimaryKeyProperty) :
                                                   _item[_foreignAction.PrimaryKeyProperty]
                                                  );

                                        _lookupResult[_id] = _item;
                                    }

                                    //loop through all items that had a foreign list to restore the items from the saved results
                                    for (var _key in _lookupForeignList) {
                                        var _entry = _lookupForeignList[_key];
                                        var _saveItem = _entry.ParentItem;  //parent item being populated for child list
                                        var _foreignItemList = [];

                                        var _foreignLookup = _entry.ForeignLookup;

                                        for (var _foreignID in _foreignLookup) {
                                            if (_lookupResult[_foreignID]) {
                                                _foreignItemList.push(_lookupResult[_foreignID]);
                                            }
                                        }

                                        _saveItem[_foreignAction.ListProperty] = _foreignItemList;
                                    }

                                    onCallback();
                                },
                                "OnError": function (err) {
                                    options.OnError(err);
                                    //do not perform callback for queue since want to exit
                                }
                            });
                        }
                        else {
                            onCallback();
                        }
                    });
                }

            })();
        }
    }

    _queue.Run({
        "Callback": function () {

            if (_result.valid) {
                options.OnSuccess(_result.list);
            }
            else {
                options.OnError(_result.err);
            }
        }
    });
};

CBusinessServiceBase.prototype.BaseSave = function (options) {

    options = util_extend({ "Data": null, "OnSuccess": null, "OnError": null }, options);

    var _data = options.Data;
    var _isList = false;

    if (_data && $.isArray(_data)) {
        _isList = true;
    }

    PRIVATE_OFFLINE_MANAGER.Update(_data, {
        "OnSuccess": function (saveData) {

            var _savedItem = (saveData && saveData.Data ? saveData.Data.List : null);

            _savedItem = (_savedItem || []);

            if (!_isList) {
                _savedItem = (_savedItem.length == 1 ? _savedItem[0] : null);
            }

            if (options.OnSuccess) {
                options.OnSuccess({ "Result": _savedItem });
            }
        },
        "OnError": function (err) {

            if (options.OnError) {
                options.OnError({ "Message": err });
            }
            else {
                util_logError(err);
            }
        }
    });

};

CBusinessServiceBase.prototype.Delete = function (options) {

    options = util_extend({ "Item": null, "OnSuccess": null, "OnError": null }, options);

    var _instance = this;
    var _queue = new CEventQueue();
    var _methodResult = { "exit": false };

    var _item = options.Item;

    var _ret = { "Success": false, "Item": _item, "RefList": null };

    options.OnSuccess = (options.OnSuccess || function (isSuccess) { });

    if (_instance.Config.GetDeleteForeignDataList) {

        _queue.Add(function (onCallback) {

            _instance.Config.GetDeleteForeignDataList({
                "Instance": _instance, "Query": _instance.Query, "Item": _item, "Callback": function (deleteList) {

                    deleteList = (deleteList || []);

                    _ret.RefList = deleteList;

                    if (deleteList.length > 0) {
                        PRIVATE_OFFLINE_MANAGER.Delete(deleteList, {
                            "OnSuccess": function () {

                                onCallback();
                            }, "OnError": options.OnError
                        });
                    }
                    else {
                        onCallback();
                    }

                }, "OnError": options.OnError });

        });
    }

    _queue.Add(function (onCallback) {
        PRIVATE_OFFLINE_MANAGER.Delete(_item, { "OnSuccess": onCallback, "OnError": options.OnError });
    });

    _queue.Run({
        "Callback": function () {
            if (!_methodResult.exit) {
                _ret.Success = true;
                options.OnSuccess(_ret);
            }
        }
    });
};

function COfflineDatabase(opts) {

    opts = util_extend({ "Callback": null }, opts);

    var _instance = this;

    this["_ready"] = false;

    this["DOM"] = {
        "Indicator": null,
        "Popup": null
    };

    this["Configuration"] = {
        "Status": { "IsOnline": null, "Info": null },
        "PromptSyncPopup": (util_forceInt(util_queryString("IsOfflinePromptSyncPopup"), enCETriState.Yes) != enCETriState.No),
        "ConfirmOnSave": (util_forceInt(util_queryString("IsOfflineConfirmOnSave"), enCETriState.Yes) != enCETriState.No),
        "DebugOfflineSyncTokenID": util_forceInt(util_queryString("DebugOfflineSyncTokenID"), enCE.None),
        "IsLog": (util_forceInt(util_queryString("IsOfflineDebug"), enCETriState.None) == enCETriState.Yes),
        "IsForceOfflineSync": false,    //debug purpose only (production value set false)
        "DOCUMENT_ID_DB_VERSION": "DB_Version",
        "DOCUMENT_ID_MODIFICATION_KEY": "ModificationKey_<PROJECT_NO>",
        "DOCUMENT_ID_AUTH_USER_ID": "AuthUserID_<PROJECT_NO>",
        "LookupIndex": {},
        "NextUniqueID": function () {
            var _id = CACHE_MANAGER.GetCacheItem(OFFLINE_DATABASE_CONFIGURATION.LocalStorageNamePrimaryKey, null, true); //NOTE: force suppress of web app toggle cache check

            if (!_id) {
                _id = -1;
            }

            //NOTE: force suppress of web app toggle cache check
            //set the next unique ID (use negative values to avoid conflict with non-zero position valid PK IDs)
            CACHE_MANAGER.SetCacheItem(OFFLINE_DATABASE_CONFIGURATION.LocalStorageNamePrimaryKey, _id - 1, true);

            return _id;
        },
        "PopupSyncOffline": {
            "IsPromptOnDismiss": false,
            "ButtonDismiss": "Dismiss",
            "ButtonSave": "Save",
            "Title": "Sync Offline Changes",
            "Instruction": util_htmlEncode("Please select the changes you wish to sync from the available offline summary. " +
                                           "Click on a detail item to toggle whether to sync or disregard the changes.") + "<br />" +
                           util_htmlEncode("Once you have reviewed your changes, click on the ") + "<b>" + util_htmlEncode("SAVE") + "</b>" +
                           util_htmlEncode(" button to submit your changes."),
            "IsInstructionHTML": true
        },
        "TransactionScopeID": 1
    };

    this["Utils"] = {

        "m_perf": {},

        "StartTimer": function (tag) {

            if (!tag) {
                tag = "def";
            }

            _instance.Utils.m_perf[tag] = (new Date()).getTime();
        },

        "StopTimer": function (tag, message) {

            if (!tag) {
                tag = "def";
            }

            var _now = (new Date()).getTime();
            var _diff = _now - _instance.Utils.m_perf[tag];

            delete _instance.Utils.m_perf[tag];

            _instance.Utils.Log({ "Message": "PERF|" + tag + "|" + util_forceString(message) + " " + _diff });
        },

        "Log": function (options) {

            if (_instance.Configuration.IsLog) {
                options = util_extend({ "Message": null }, options);

                util_log("COfflineDatabase :: " + options.Message);
            }
        },

        "LogError": function (err, options) {

            var _msg = null;

            if (err && typeof err === "object") {

                if (err["message"]) {
                    _msg = err["message"];
                }
                else {
                    try {
                        _msg = util_stringify(err);
                    } catch (e) {
                        _msg = null;
                    }
                }
            }

            if (util_forceString(_msg) == "") {
                _msg = "unkown error";
            }

            util_logError(_msg);
            console.log("ERROR", err);
        },

        "ForceDocumentID": function (val) {

            //must force to be string (requirement)
            val = util_forceString(val) + "";

            return val;
        },

        "ConvertErrorToServiceResult": function (err) {

            var _result = new CServiceResult();
            var _errorType = null;

            switch (err.status) {

                case 404:
                    _errorType = enCEServiceErrorType.NonExistent;
                    break;

                case 409:
                    _errorType = enCEServiceErrorType.SaveConflict;
                    break;

                default:
                    _errorType = enCEServiceErrorType.Unknown;
                    break;
            }

            _result[enColCServiceResultProperty.ErrorMessage] = err.message;
            _result[enColCServiceResultProperty.ErrorType] = _errorType;

            return _result;
        },

        "GetFilterFunction": function (options) {

            options = util_extend({ "Type": enCOfflineFilterFunctionType.Default, "Property": null, "GetItemValue": null, "SearchValue": null }, options);

            var _fn = {
                "Type": options.Type,

                "Property": null,
                "GetItemValue": null,
                "SearchCriteria": null,

                "GetValue": function (data) {
                    var _val = null;

                    if (data) {
                        if (this.Property) {
                            _val = data[this.Property];
                        }
                        else if (this.GetItemValue) {
                            _val = this.GetItemValue.apply(this, data);
                        }
                    }

                    return _val;
                },

                "IsType": function (v) {
                    return (this.Type == v);
                },

                "Validate": function (data, search) {
                    return true;
                },

                "ApplyFilter": function (data) {
                    return this.Validate(data, this.SearchCriteria);
                }
            };

            _fn.SearchCriteria = options.SearchValue;
            _fn.Property = options.Property;
            _fn.GetItemValue = options.GetItemValue;

            switch (options.Type) {

                case enCOfflineFilterFunctionType.Default:
                case enCOfflineFilterFunctionType.Identifier:
                case enCOfflineFilterFunctionType.TriState:
                case enCOfflineFilterFunctionType.TextSearch:
                case enCOfflineFilterFunctionType.Date:

                    _fn.Validate = function (data, search) {
                        var _valid = true;

                        if ((this.IsType(enCOfflineFilterFunctionType.Identifier) && util_forceInt(search, enCE.None) == enCE.None) ||
                            (this.IsType(enCOfflineFilterFunctionType.TriState) && util_forceInt(search, enCETriState.None) == enCETriState.None) ||
                            (this.IsType(enCOfflineFilterFunctionType.TextSearch) && util_forceString(search, "") == "")
                        ) {
                            _valid = true;
                        }
                        else {
                            var _val = this.GetValue(data);

                            if (this.IsType(enCOfflineFilterFunctionType.TextSearch)) {

                                if (!search) {
                                    search = util_forceString(search);
                                }

                                _val = util_forceString(_val);

                                _valid = (_val.toLowerCase().indexOf(search.toLowerCase()) >= 0);
                            }
                            else {
                                _valid = (_val === search);
                            }
                        }

                        return _valid;
                    };

                    break;
            }

            return _fn;
        },

        "ListForceDate": function (data, opts) {
            data = (data || []);

            opts = util_extend({ "Property": null }, opts);

            var _properties = opts.Property;

            if (!_properties) {
                _properties = [];
            }
            else if (_properties && !$.isArray(_properties)) {
                _properties = [_properties];
            }

            for (var i = 0; i < data.length; i++) {
                var _item = data[i];

                for (var p = 0; p < _properties.length; p++) {
                    var _prop = _properties[p];

                    _item[_prop] = util_JS_convertToDate(_item[_prop], null);
                }
            }

            return data;
        },

        "RestoreDateFields": function (item, opts) {

            if (!item) {
                return;
            }

            opts = util_extend({ "Property": null, "TypeName": null }, opts);

            var _properties = opts.Property;

            if (!_properties) {
                _properties = [];

                if (!opts.TypeName) {
                    opts.TypeName = item["TypeName"];
                }

                if (opts.TypeName && ENTITY_METADATA.LookupEntityTypeName[opts.TypeName]) {
                    var _entityType = ENTITY_METADATA.LookupEntityTypeName[opts.TypeName];

                    _properties = _entityType["DatePropertyList"];
                }
            }
            else if (_properties && !$.isArray(_properties)) {
                _properties = [_properties];
            }

            for (var p = 0; p < _properties.length; p++) {
                var _prop = _properties[p];

                var _val = item[_prop];

                if (_val && typeof _val === "string") {
                    try {
                        _val = new Date(_val);

                        if (((_val instanceof Date) && !isNaN(_val.valueOf())) == false) {
                            _val = util_JS_convertToDate(_val, null);
                        }
                    } catch (e) {
                        _val = util_JS_convertToDate(_val, null);
                    }

                    item[_prop] = _val;
                }
            }
        },

        "IsEntityType": function (val, typeName) {
            return (val && val["TypeName"] && val.TypeName === typeName);
        },
        "ExtendEntity": function (val, entityType) {
            return util_extend(new entityType(), val);
        },
        "ForceEntityType": function (val, entityType, options) {
            if (!_instance.Utils.IsEntityType(val, entityType["EntityTypeName"])) {
                val = _instance.Utils.ExtendEntity(val, entityType);
            }

            if (val && entityType && entityType["ExtPropertyDefinitions"] && entityType.ExtPropertyDefinitions[enColCExtPropertyDefinitionsProperty.Items]) {

                options = util_extend({ "FilterProperties": null }, options);

                var _lookupFilterProp = null;

                if (options.FilterProperties && $.isArray(options.FilterProperties) && options.FilterProperties.length > 0) {
                    _lookupFilterProp = {};

                    for (var i = 0; i < options.FilterProperties.length; i++) {
                        var _prop = options.FilterProperties[i];

                        _lookupFilterProp[_prop] = true;
                    }
                }

                var _definitions = entityType.ExtPropertyDefinitions[enColCExtPropertyDefinitionsProperty.Items];

                for (var i = 0; i < _definitions.length; i++) {
                    var _propDef = _definitions[i];
                    var _prop = _propDef[enColCExtPropertyDefinitionProperty.Property];

                    if (!_lookupFilterProp || _lookupFilterProp[_prop]) {
                        var _propValue = val[_prop];

                        if (_propValue) {

                            if (_propDef[enColCExtPropertyDefinitionProperty.IsEnumerable]) {

                                //array
                                if ($.isArray(_propValue)) {

                                    for (var v = 0; v < _propValue.length; v++) {
                                        var _arrItem = _propValue[v];

                                        _propValue[v] = _instance.Utils.ForceEntityType(_arrItem, _propDef["m_type"]);
                                    }
                                }
                            }
                            else {

                                //single item
                                _propValue = _instance.Utils.ForceEntityType(_propValue, _propDef["m_type"]);
                            }

                            val[_prop] = _propValue;
                        }
                    }
                }

            }

            return val;
        }
    };

    this["Events"] = {

        "Init": function (options) {

            options = util_extend({ "Callback": null, "ListIndexDB": [], "IsDataSync": false }, options);

            var _fnOnReady = function () {

                _instance["_ready"] = true;

                _instance.DOM.Indicator.fadeOut("normal", function () {
                    _instance.DOM.Indicator.children(".Label").empty();
                });
            };

            var _callback = function () {

                _fnOnReady();

                if (options.Callback) {
                    options.Callback();
                }

            };

            var _isRebuildLookup = true;

            var _queue = new CEventQueue();

            if (options.IsDataSync) {

                _queue.Add(function (onCallback) {

                    //refresh user session detail prior to syncing the data, if applicable
                    ext_refreshUserSessionDetail(function () {

                        _instance.DOM.Indicator.show();

                        if (!global_userLoggedIn()) {

                            //exit queue and force user to login screen
                            _fnOnReady();
                            GoToLogin();
                        }
                        else {
                            onCallback();
                        }
                    });

                });
            }
            else {
                _instance.DOM.Indicator.show();
            }

            //configure all index that require initialization, if applicable
            if (!options.IsDataSync) {

                if (options.ListIndexDB && !$.isArray(options.ListIndexDB)) {
                    options.ListIndexDB = [options.ListIndexDB];
                }
                else {
                    options.ListIndexDB = (options.ListIndexDB || []);
                }

                options.ListIndexDB = $.merge([

                    //sync/modification index
                    { "name": "INDX_META_SYNC_TYPE", "fields": ["TypeName", OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE] },

                    //archive index
                    {
                        "_type": COfflineArchive,
                        "name": "INDX_META_ARCHIVE",
                        "fields": [enColCOfflineArchiveProperty.ArchiveTypeName, enColCOfflineArchiveProperty.DisplayName]
                    }
                ], options.ListIndexDB);

                _queue.Add(function (onCallback) {
                    _instance.Events.CreateIndex({ "List": options.ListIndexDB, "Callback": onCallback });
                });
            }

            _queue.Add(function (onCallback) {

                util_isOnline(function (isOnline) {

                    _instance.Configuration.Status.IsOnline = isOnline;

                    //ensure the application is online prior to syncing the default cached data
                    if (!isOnline) {

                        _instance.Utils.Log({ "Message": "Data sync verification disabled - application is currently not available (offline)" });

                        _instance.Events.GetModificationDetail({
                            "OnSuccess": ext_requestSuccess(function (item) {

                                var _disableSave = true;

                                if (!item["RequireSync"]) {
                                    item["RequireSync"] = true;
                                    _disableSave = false;
                                }

                                _instance.Events.SetModificationDetail({ "Item": item, "DisableSave": _disableSave, "Callback": onCallback });
                            })
                        });

                        return;
                    }

                    //refresh user session detail prior to syncing the data, if applicable
                    ext_refreshUserSessionDetail(function () {

                        _instance.Events.GetModificationKey(function (modificationKey) {

                            var _isLoggedIn = global_userLoggedIn();

                            if (!modificationKey || !_isLoggedIn) {
                                modificationKey = (new Date().getTime()) + "";
                            }

                            _instance.Utils.Log({ "Message": "Current modification key - " + modificationKey });

                            //get the cached modification detail
                            _instance.Events.GetModificationDetail({
                                "OnSuccess": ext_requestSuccess(function (result) {

                                    var _item = result;
                                    var $lbl = _instance.DOM.Indicator.children(".Label");
                                    var _progress = { "Total": null };

                                    var _fnPopulate = function (pos, arrCacheData, populateCallback) {

                                        if (pos == 1) {
                                            _progress.Total = arrCacheData.length;
                                        }

                                        if (arrCacheData.length == 0) {
                                            if (populateCallback) {
                                                populateCallback();
                                            }
                                        }
                                        else {
                                            var _entry = arrCacheData.shift();
                                            var _arr = _entry.v;

                                            for (var i = 0; i < _arr.length; i++) {
                                                var _cacheItem = _arr[i];

                                                _cacheItem["meta_subtype"] = "cache";
                                            }

                                            var _logSuffix = "|existing data|" + _entry.t + ":";

                                            $lbl.text((_progress.Total > 0 ? (pos + " of " + _progress.Total + ": ") : "") + util_forceString(_entry["msg"]));

                                            _instance.SelectExt({
                                                "FilterTypeName": _entry.t, "Matches": [{ "prop": "meta_subtype", "v": "cache" }],
                                                "OnSuccess": ext_requestSuccess(function (data) {

                                                    var _deleteList = (data.List || []);

                                                    _instance.Utils.StartTimer("deleteDataDB_" + pos);

                                                    _instance.Delete(_deleteList, {
                                                        "IsArchive": false, //disable archive since this is application initiated and not user action
                                                        "OnSuccess": function () {

                                                            _instance.Utils.StopTimer("deleteDataDB_" + pos, "*DELETE" + _logSuffix);

                                                            _instance.Utils.StartTimer("updateDataDB_" + pos);

                                                            _instance.Update(_arr, {

                                                                //set the default modification type to flag that it is initial insert (for offline save)
                                                                "ModificationType": enCOfflineDataSync.None,
                                                                "IsReturnResults": false,   //do not return the results since mainly populating the database (improved performance)
                                                                "OnSuccess": function () {

                                                                    _instance.Utils.StopTimer("updateDataDB_" + pos, "*INSERT" + _logSuffix);
                                                                    _fnPopulate(pos + 1, arrCacheData, populateCallback);
                                                                },
                                                                "OnError": function (err) {
                                                                    console.log(err);
                                                                }
                                                            });

                                                        }
                                                    });
                                                })
                                            });

                                        }

                                    };  //end: _fnPopulate

                                    _instance.Utils.Log({ "Message": "*Checking previous modification key - " + util_stringify(_item) });

                                    if (_item && (util_forceBool(_item["RequireSync"], false) || _instance.Configuration.IsForceOfflineSync)) {

                                        _isRebuildLookup = false;

                                        _instance.Utils.LookupNameField.Refresh({
                                            "Callback": function () {

                                                _instance.Events.SetModificationDetail({
                                                    "Item": _item, "DisableSave": true, "Callback": function () {

                                                        _fnOnReady();

                                                        _instance.Events.PromptConnectivityChange({
                                                            "StateFrom": false, "StateTo": isOnline, "Callback": onCallback
                                                        });
                                                    }
                                                });
                                            }
                                        });

                                    }
                                    else if (!_item || _item["Key"] != modificationKey) {

                                        _isRebuildLookup = false;

                                        //cached data's modification key has changed (requiring updates)
                                        var _prevKey = (_item ? _item["Key"] : null);

                                        if (!_item) {
                                            _item = {};
                                        }

                                        _item["Key"] = modificationKey;
                                        _item["LastOnline"] = new Date();

                                        _instance.Utils.Log({ "Message": "Modification key has been updated | " + _item["Key"] });

                                        //persist current user ID
                                        _instance.Events.SetAuthUserID({
                                            "Callback": function () {

                                                //modification key has changed, so retrieve the new data to be cached and update the local database
                                                _instance.Events.GetProjectCacheData({
                                                    "OldModificationKey": _prevKey, "NewModificationKey": modificationKey,
                                                    "Callback": function (cacheData) {

                                                        cacheData = (cacheData || []);

                                                        _instance.Utils.Log({ "Message": "Load complete for project cache data" });

                                                        _instance.Events.SetModificationDetail({
                                                            "Item": _item, "Callback": function () {

                                                                _instance.Utils.Log({ "Message": "Update project cache data" });
                                                                _instance.Utils.StartTimer("init_insert");

                                                                _fnPopulate(1, cacheData, function () {
                                                                    _instance.Utils.StopTimer("init_insert", "INSERT cache data duration:");
                                                                    onCallback();
                                                                });
                                                            }
                                                        });

                                                    }
                                                }); //end: GetProjectCacheData

                                            }

                                        }); //end: SetAuthUserID

                                    }
                                    else {

                                        //no updates needed
                                        _instance.Utils.Log({ "Message": "Modification key no change | disable data resync" });

                                        //set the modification detail (without saving to database)
                                        _instance.Events.SetModificationDetail({ "Item": _item, "DisableSave": true, "Callback": onCallback });
                                    }

                                })
                            });

                        });
                    });

                }, null, { "DisableCacheResult": true }); //end: check if application is online

            });

            _queue.Add(function (onCallback) {

                if (_isRebuildLookup) {
                    _instance.Utils.LookupNameField.Refresh({ "Callback": onCallback });
                }
                else {
                    onCallback();
                }
            });

            _queue.Run({ "Callback": _callback });
        },

        "Destroy": function (options) {

            var $lbl = null;

            options = util_extend({ "IsPrompt": true, "IsInitOnCreate": true, "Callback": null }, options);

            var _callback = function () {

                if (_instance.DOM.Indicator) {
                    _instance.DOM.Indicator.hide();

                    if ($lbl) {
                        $lbl.empty();
                    }
                }

                if (!PRIVATE_DB) {
                    PRIVATE_DB = new PouchDB(OFFLINE_DATABASE_CONFIGURATION.Name, { size: OFFLINE_DATABASE_CONFIGURATION.DefaultSize });

                    if (options.IsInitOnCreate) {
                        PRIVATE_OFFLINE_MANAGER = new COfflineDatabase({ "Callback": options.Callback });
                    }
                    else if (options.Callback) {
                        options.Callback();
                    }
                }
                else if (options.Callback) {
                    options.Callback();
                }
            };

            _callback = (_callback || function () { });

            var _fn = function () {

                try {

                    if (_instance.DOM.Indicator) {
                        $lbl = _instance.DOM.Indicator.children(".Label");

                        _instance.DOM.Indicator.show();
                        $lbl.text("Deleting all user offline data...");
                    }

                    PRIVATE_DB.destroy().then(function (result) {

                        PRIVATE_DB = null;

                        //restart the primary key value from the cache (since database was destroyed with all data)
                        CACHE_MANAGER.RemoveCacheItem(OFFLINE_DATABASE_CONFIGURATION.LocalStorageNamePrimaryKey);

                        _callback();

                    })["catch"](function (err) {

                        util_logError(err);
                        console.log(err);

                        _callback();
                    });
                } catch (e) {
                    _callback();
                }

            };  //end: _fn

            if (options.IsPrompt) {

                dialog_confirmYesNo("Delete Offline Changes",
                                    "<div>" + util_htmlEncode("You are about to remove all unsaved changes that were made during offline mode?") + "</div><br />" +
                                    "<div>" +
                                    "   <b>" + util_htmlEncode("WARNING: ") + "</b>" + util_htmlEncode("this action cannot be undone and all data will be removed.") +
                                    "</div>", _fn,
                                    null, true);
            }
            else {
                _fn();
            }

        },

        "GetModificationDetail": function (options) {
            _instance.GetByID(_instance.Configuration.DOCUMENT_ID_MODIFICATION_KEY, options);
        },

        "SetModificationDetail": function (options) {

            options = util_extend({ "Item": null, "Callback": null, "DisableSave": false }, options);

            var _callback = function (result) {

                if (result) {
                    _instance.Configuration.Status.Info = result;
                }

                if (options.Callback) {
                    options.Callback(result);
                }
            };

            var _item = options.Item;

            if (_item) {
                _item["_id"] = _instance.Configuration.DOCUMENT_ID_MODIFICATION_KEY;
            }

            if (options.DisableSave) {
                _callback(_item);
            }
            else {
                _instance.Update(_item, {
                    "OnSuccess": ext_requestSuccess(function (savedItem) {

                        var _result = (savedItem && savedItem.List ? savedItem.List : null);

                        _result = (_result || []);
                        _result = (_result.length == 1 ? _result[0] : null);

                        _callback(_result);
                    }),
                    "OnError": function (err) {
                        util_logError(err);
                        _callback(null);
                    }
                });
            }
        },

        "GetAuthUserID": function (options) {
            _instance.GetByID(_instance.Configuration.DOCUMENT_ID_AUTH_USER_ID, options);
        },

        "SetAuthUserID": function (options) {

            options = util_extend({ "Callback": null }, options);

            var _callback = function (result) {

                if (options.Callback) {
                    options.Callback(result);
                }
            };

            var _item = {};

            _item["_id"] = _instance.Configuration.DOCUMENT_ID_AUTH_USER_ID;
            _item["UserID"] = global_AuthUserID();  //retrieve it from current session

            _instance.Update(_item, {
                "OnSuccess": ext_requestSuccess(function (savedItem) {

                    var _result = (savedItem && savedItem.List ? savedItem.List : null);

                    _result = (_result || []);
                    _result = (_result.length == 1 ? _result[0] : null);

                    _callback(_result);
                }),
                "OnError": function (err) {
                    util_logError(err);
                    _callback(null);
                }
            });

        },

        "CreateIndex": function (options) {

            options = util_extend({ "IsValidateUnique": true, "DisableIndexRebuilds": true, "List": null, "Callback": null }, options);

            var _handled = {};

            var _list = (options.List || []);
            var _result = { "Success": true, "Summary": [] };

            if (_list && !$.isArray(_list)) {
                _list = [_list];
            }

            var _queue = new CEventQueue();

            _queue.Add(function (onCallback) {

                if (!options.DisableIndexRebuilds) {
                    onCallback();
                    return;
                }

                var _fnPopulateLookup = function (list) {

                    list = (list || []);

                    for (var ind = 0; ind < list.length; ind++) {
                        var _indexDetail = list[ind];

                        if (_indexDetail["name"]) {
                            _handled[_indexDetail.name] = { "Success": true, "Index": _indexDetail };
                        }
                    }

                    onCallback();

                };  //end: _fnPopulateLookup

                PRIVATE_DB.getIndexes().then(function (result) {
                    _fnPopulateLookup(result ? result["indexes"] : null);
                })["catch"](function (err) {
                    util_logError("CreateIndex - Load Index List :: " + (err && err["message"] ? err.message : "unknown"));
                    console.log("ERROR", err);

                    _fnPopulateLookup(null);
                });

            });

            for (var i = 0; i < _list.length; i++) {

                //private scoped queue execution
                (function () {

                    var _current = i;

                    var _indexOpt = util_extend({}, _list[i]);

                    var _name = util_forceString(_indexOpt["name"]);

                    if (_name == "") {
                        util_logError("CreateIndex :: index entry at position " + (i + 1) + " missing required 'name' property");
                    }
                    else {
                        _indexOpt["ddoc"] = _name + "_def";
                        _indexOpt["type"] = "json";
                    }

                    if (_indexOpt["_type"]) {
                        var _type = _indexOpt["_type"];

                        if (typeof _type !== "string") {

                            if (_type["EntityTypeName"]) {

                                //attempt to retrieve it from the entity instance (if available)
                                _type = _type["EntityTypeName"];
                            }
                            else {

                                //fallback retrieve it after invoking a new instance of the type
                                var _temp = new _type();

                                if (_temp["TypeName"]) {
                                    _type = util_forceString(_temp["TypeName"]);
                                }
                            }
                        }
                        else {
                            _type = util_forceString(_indexOpt["_type"]);
                        }

                        _indexOpt["_type"] = _type;
                        _indexOpt["fields"] = $.merge(["TypeName"], _indexOpt["fields"]);
                    }

                    _queue.Add(function (onCallback) {

                        _instance.Utils.Log({ "Message": "Create index | " + (_current + 1) + " of " + _list.length + " | " + _name });

                        var _fnIndexSuccess = function (result, mappedIndexName) {

                            if (_name != "") {

                                if (mappedIndexName) {
                                    _indexOpt["_mapped"] = mappedIndexName;
                                }

                                _instance.Configuration.LookupIndex[_name] = _indexOpt;
                            }

                            _result.Summary.push(result);
                            onCallback();

                        };  //end: _fnIndexSuccess

                        if (options.IsValidateUnique) {

                            var _key = "GLOBAL_INDX_" + util_arrJoinStr(_indexOpt["fields"], null, "_", null);
                            var _indexDDOC = _key + "_def";

                            //check if the index has been previously created
                            if (_handled[_key]) {
                                var _cached = _handled[_key];

                                _instance.Utils.Log({ "Message": "*Reuse index..." + _key });

                                _indexOpt["_mapped"] = _indexDDOC;  //set the mapped index name ddoc (since can reuse existing index)

                                _fnIndexSuccess(_cached.Success, _indexDDOC);
                            }
                            else {

                                var _genericIndexOpt = {};

                                _genericIndexOpt["name"] = _key;
                                _genericIndexOpt["fields"] = _indexOpt["fields"];
                                _genericIndexOpt["ddoc"] = _indexDDOC;

                                _instance.Utils.StartTimer("createIndex_" + _current);

                                PRIVATE_DB.createIndex(_genericIndexOpt)
                                      .then(function (result) {

                                          _instance.Utils.StopTimer("createIndex_" + _current, "*On CREATE INDEX complete|" + _key + ":");

                                          _handled[_key] = { "Success": result };
                                          _fnIndexSuccess(result, _indexDDOC);
                                      })["catch"](function (err) {
                                          _result.Success = false;
                                          _result.Summary.push(err);
                                      });
                            }
                        }
                        else {

                            PRIVATE_DB.createIndex(_indexOpt)
                                      .then(function (result) {
                                          _fnIndexSuccess(result);
                                      })["catch"](function (err) {
                                          _result.Success = false;
                                          _result.Summary.push(err);
                                      });
                        }

                    });

                })();
            }

            _instance.Utils.StartTimer("create_index");

            _queue.Run({
                "Callback": function () {

                    _instance.Utils.StopTimer("create_index", "CREATE INDEX duration:");

                    if (options.Callback) {
                        options.Callback(_result);
                    }
                }
            });
        },

        "OnConnectivityChange": function (options) {

            options = util_extend({ "From": null, "Callback": null }, options);

            var _callback = function () {
                if (options.Callback) {
                    options.Callback();
                }
            };

            var _invokeFrom = util_forceString(options.From);
            var _stateChanged = false;

            var _isOnline = _instance.Configuration.Status.IsOnline;

            if (!util_isNullOrUndefined(_isOnline)) {

                switch (_invokeFrom) {

                    case "service_error":
                        _stateChanged = _isOnline;  //state has changed from connected to offline (since it was invokved from service error while it was online)
                        break;

                    case "service_success":
                        _stateChanged = !_isOnline; //state has changed from offline to connected (since it was invokved from service success while it was offline)
                        break;

                    default:

                        //not handled
                        _stateChanged = false;
                        break;
                }
            }

            _stateChanged = (_stateChanged && global_userLoggedIn());   //ensure user is logged in prior to checking connectivity change

            if (!_stateChanged) {
                _callback();
            }
            else {

                util_isOnline(function (nowIsOnline) {

                    _stateChanged = (_isOnline !== nowIsOnline);

                    if (_stateChanged) {

                        _instance.Utils.Log({ "Message": "*State change | from: " + (_isOnline ? "CONNECTED" : "OFFLINE") + " to " + (nowIsOnline ? "CONNECTED" : "OFFLINE") });

                        _instance.Configuration.Status.IsOnline = nowIsOnline;  //update the online state

                        var _modificationDetail = _instance.Configuration.Status.Info;

                        if (!_modificationDetail) {
                            _modificationDetail = {};
                        }

                        //set flag that the offline data needs to be synced, if applicable
                        _modificationDetail["RequireSync"] = (_modificationDetail["RequireSync"] || nowIsOnline || (!nowIsOnline && !_modificationDetail["RequireSync"]));

                        _instance.Events.SetModificationDetail({
                            "Item": _modificationDetail, "Callback": function () {
                                _instance.Events.PromptConnectivityChange({ "Callback": _callback, "StateFrom": _isOnline, "StateTo": nowIsOnline, "ExtArgs": options });
                            }
                        });
                    }
                    else {
                        _callback();
                    }

                }, null, { "DisableCacheResult": true });   //disable cache result for the check

            }
        },

        "PromptConnectivityChange": function (options) {

            options = util_extend({ "StateFrom": null, "StateTo": null, "ExtArgs": null, "Callback": null }, options);

            var _callback = function () {

                if (options.Callback) {
                    options.Callback();
                }
            };

            var _stateFrom = options.StateFrom;
            var _stateNow = options.StateTo;

            var _fnShowNotification = function () {

                var $body = $("body");
                var $notification = $body.find("#vwOfflineNotification.COfflineNotification");

                if ($notification.length == 0) {

                    $notification = $("<div id='vwOfflineNotification' class='DisableUserSelectable COfflineFixedPosition COfflineNotification'>" +
                                      "  <div class='Icon' />" +
                                      "  <div class='Label' />" +
                                      "</div>");

                    $body.append($notification);
                }
                
                $notification.finish();
                $notification.hide();

                $notification.toggleClass("StateOn", _stateNow)
                             .toggleClass("StateOff", !_stateNow);

                $notification.children(".Label")
                             .text(_stateNow ? "Online (connected)" : "Offline (disconnected)");

                var _dt = (new Date()).getTime();

                $notification.data("timestamp", _dt);

                $notification.fadeIn("slow", function () {

                    setTimeout(function () {
                        if ($notification.data("timestamp") == _dt) {
                            $notification.fadeOut("normal");
                        }
                    }, 3000);
                });

            };

            _fnShowNotification();

            if (_instance.Configuration.PromptSyncPopup && !_stateFrom && _stateNow) {

                //application has returned online from offline state
                var $popup = _instance.DOM.Popup;

                if (!$popup || $popup.length == 0) {
                    $popup = $("<div class='COfflinePopup'>" +
                               "    <div class='EffectBlur COfflineFixedPosition' />" +
                               "    <div class='COfflineFixedPosition PopupContent' />" +
                               "</div>");
                    $popup.hide();

                    $("body").append($popup);
                }
                else if ($popup.length == 1 && $popup.is(":visible") && $popup.data("IsActive")) {
                    _callback();
                    return;
                }

                var $content = $popup.children(".PopupContent");

                $content.html("<div class='ProgressBar'>" +
                              "  <div class='ModeIndeterminate' />" +
                              "</div>");

                if (!$popup.data("is-init")) {
                    $popup.data("is-init", true);

                    $popup.off("events.offlinePopup_finish");
                    $popup.on("events.offlinePopup_finish", function (e, args) {

                        args = util_extend({ "IsCleanup": true }, args);

                        $("body").removeClass("COfflineScreen");

                        $popup.toggle("height", function () {

                            var _onCallback = $popup.data("OnCallback");
                            var _modification = _instance.Configuration.Status.Info;

                            if (!_onCallback) {
                                _onCallback = function () { };
                            }

                            if (!_modification) {
                                _modification = {};
                            }

                            if (args.IsCleanup) {

                                //remove flag for the sync validation
                                delete _modification["RequireSync"];

                                _instance.Events.SetModificationDetail({
                                    "Item": _modification, "Callback": function () {

                                        $popup.removeData("OnCallback");

                                        //recreate the database (since the sync has been successfully performed)
                                        var _fnRecreateDB = function () {

                                            PRIVATE_OFFLINE_MANAGER.Events.Destroy({
                                                "IsPrompt": false,
                                                "Callback": _onCallback
                                            });
                                        };

                                        APP.Service.Action({
                                            "c": "OfflineDatabase", "m": "OnSyncRequestEnd",
                                            "args": {
                                                "Token": $popup.data("Token")
                                            }
                                        }, function (token) {

                                            $popup.data("Token", token);

                                            _fnRecreateDB();

                                        }, function () {

                                            _fnRecreateDB();
                                        });

                                    }
                                });
                            }
                            else {

                                $popup.removeData("OnCallback");
                                _onCallback();
                            }

                        });

                    });

                    $popup.off("events.offlinePopup_setTabTitle");
                    $popup.on("events.offlinePopup_setTabTitle", ".TabItem", function (e, args) {

                        var $tab = $(this);

                        args = util_extend({ "OverrideTitle": null }, args);

                        var _title = util_forceString(args.OverrideTitle);

                        if (_title == "") {
                            var _format = $tab.data("TitleFormat");

                            if (util_forceString(_format) == "") {
                                _format = "%%COUNT%%";
                            }

                            var $tabContent = $tab.data("ElementTabContent");

                            if (!$tabContent) {
                                var $tabs = $content.find(".TabView .TabItem");
                                var $tabContents = $content.find(".TabView .TabContent");

                                $tabContent = $tabContents.get($tabs.index($tab));
                                $tabContent = $($tabContent);

                                $tabContent.data("ElementTabContent", $tabContent);
                            }

                            var $details = $tabContent.find(".DetailView .DetailItem");

                            var _selected = $details.filter(".Selected").length;
                            var _total = $details.length;

                            _title = util_replaceAll(_format, "%%COUNT%%", util_htmlEncode(_selected + " of " + _total), true);

                        }

                        $tab.children(".Label")
                            .html(_title);

                    });

                    $popup.off("click.offlinePopup_viewTab");
                    $popup.on("click.offlinePopup_viewTab", ".TabView:not(.Disabled) .TabItem:not(.Selected)", function (e, args) {
                        var $tab = $(this);
                        var $tabView = $tab.closest(".TabView");

                        var $tabs = $tabView.find(".TabItem");
                        var $tabContents = $tabView.find(".TabContent");

                        var _index = $tabs.index($tab);

                        $tabs.filter(".Selected")
                             .removeClass("Selected");

                        $tab.addClass("Selected");

                        $tabContents.filter(":visible").hide();
                        $($tabContents.get(_index)).show();

                    });

                    $popup.off("click.offlinePopup_toggleDetail");
                    $popup.on("click.offlinePopup_toggleDetail", ".DetailView .DetailItem:not(.Disabled)", function () {

                        var $detail = $(this);

                        var _selected = !$detail.hasClass("Selected");

                        $detail.toggleClass("Selected");

                        var $tabContent = $detail.closest(".TabContent");
                        var $tab = $tabContent.data("ElementTabItem");

                        if (!$tab) {
                            var $tabs = $content.find(".TabView .TabItem");
                            var $tabContents = $content.find(".TabView .TabContent");

                            $tab = $tabs.get($tabContents.index($tabContent));
                            $tab = $($tab);

                            $tabContent.data("ElementTabItem", $tab);
                        }

                        $tab.trigger("events.offlinePopup_setTabTitle");
                        $detail.trigger("events.offlinePopup_applyToggleActions", { "Tab": $tab });
                    });

                    $popup.off("events.offlinePopup_loadTabs");
                    $popup.on("events.offlinePopup_loadTabs", function (e, args) {

                        args = util_extend({ "Callback": null }, args);

                        var _resultLoadTabs = { "HasData": true };

                        var _queue = new CEventQueue();
                        var _query = new CQuery();

                        var _list = ($popup.data("PropertyList") || []);

                        var _fnRenderEntity = function (renderOpts, $currentTab, $container, groupIndex, indx, groups, onRenderCallback) {

                            if (groupIndex == 0 && indx == 0) {

                                renderOpts = util_extend({
                                    "PropertyTitle": null, "TableDefinition": null, "IsArray": false, "ExtPropertyList": null,
                                    "AttributePropertyList": null
                                }, renderOpts);

                                if ($.isArray(renderOpts.PropertyTitle)) {
                                    renderOpts.IsArray = true;
                                }
                                else {
                                    renderOpts.IsArray = false;
                                    renderOpts.PropertyTitle = util_forceString(renderOpts.PropertyTitle);
                                }

                                renderOpts.ExtPropertyList = (renderOpts.ExtPropertyList || []);
                                renderOpts.AttributePropertyList = (renderOpts.AttributePropertyList || []);

                                renderOpts["HasData"] = false;
                                renderOpts["Index"] = 0;
                                groups = (groups || []);
                            }

                            var _currentGroup = null;
                            var dataList = null;

                            if (groupIndex < groups.length) {
                                _currentGroup = groups[groupIndex];
                                dataList = (_currentGroup["d"] || []);
                            }

                            //check if the render has reached the end of the current group list and should go to next group
                            if (dataList && indx >= dataList.length && groupIndex < groups.length) {

                                _currentGroup = null;
                                dataList = null;
                                indx = 0;

                                groupIndex++;

                                //find the next available group with data
                                while (groupIndex < groups.length) {
                                    _currentGroup = groups[groupIndex];
                                    dataList = (_currentGroup["d"] || []);

                                    if (dataList.length > 0) {
                                        break;
                                    }
                                    else {

                                        //current group has no data so check the next group
                                        _currentGroup = null;
                                        dataList = null;
                                        groupIndex++;
                                    }
                                }
                            }

                            if (indx == 0 && _currentGroup && !_currentGroup["hideTitle"] && dataList && dataList.length > 0) {
                                $container.append("<div class='Title'>" + util_htmlEncode(_currentGroup["n"]) + "</div>");
                            }

                            if (!_currentGroup || !dataList || (indx >= dataList.length)) {

                                var _hasResults = renderOpts.HasData;

                                if (!_hasResults) {
                                    $container.append("<div class='NoRecordsLabel'>" + util_htmlEncode(MSG_CONFIG.ListNoRecords) + "</div>");
                                }

                                $currentTab.attr("data-attr-tab-has-results", _hasResults ? enCETriState.Yes : enCETriState.No);

                                if (onRenderCallback) {
                                    onRenderCallback();
                                }
                            }
                            else {

                                renderOpts.HasData = true;

                                var _max = Math.min(indx + 10, dataList.length - 1);
                                var _html = "";
                                var _hasTitleProperty = (renderOpts.IsArray ? renderOpts.PropertyTitle.length > 0 : (renderOpts.PropertyTitle != ""));

                                var _hasExtProperties = (renderOpts.ExtPropertyList ? renderOpts.ExtPropertyList.length > 0 : false);

                                var _itemCssClass = "DisableUserSelectable COfflineCardView DetailItem";

                                if (_currentGroup["itemCssClass"]) {
                                    _itemCssClass += " " + _currentGroup["itemCssClass"];
                                }

                                for (var i = indx; i <= _max; i++) {

                                    var _listItem = dataList[i];
                                    var _titleHTML = null;
                                    var _attr = util_htmlAttribute("data-attr-detail-index", renderOpts.Index++);
                                    var _syncType = util_forceInt(_listItem[OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE], enCOfflineDataSync.None);
                                    var _syncText = "";
                                    var _isArchive = (_listItem["_IsArchive"] == true);

                                    switch (_syncType) {

                                        case enCOfflineDataSync.Insert:
                                            _syncText = "Add New";
                                            break;

                                        case enCOfflineDataSync.Update:
                                            _syncText = "Update";
                                            break;

                                        default:

                                            if (_isArchive) {
                                                _syncText = "Deleted";
                                            }

                                            break;
                                    }

                                    if (_hasTitleProperty) {

                                        if (renderOpts.IsArray) {

                                            _titleHTML = "";

                                            for (var p = 0; p < renderOpts.PropertyTitle.length; p++) {
                                                var _prop = renderOpts.PropertyTitle[p];

                                                _titleHTML += "<div class='" + (p == 0 ? "Heading" : "SubTitle") + "'>" +
                                                              util_htmlEncode(_listItem[_prop]) +
                                                              "</div>";
                                            }
                                        }
                                        else {
                                            _titleHTML = "<div class='Heading'>" + util_htmlEncode(_listItem[renderOpts.PropertyTitle]) + "</div>";
                                        }
                                    }
                                    else {
                                        _titleHTML = "<div class='Heading'>" + util_htmlEncode("NA") + "</div>";
                                    }

                                    if (_hasExtProperties) {

                                        _titleHTML += "<div class='Divider' />" +
                                                      "<table class='TableSummary' border='0' cellpadding='0' cellspacing='0'>";

                                        for (var p = 0; p < renderOpts.ExtPropertyList.length; p++) {
                                            var _extProp = renderOpts.ExtPropertyList[p];
                                            var _val = _listItem[_extProp.Property];

                                            if (_extProp["IsDateTime"]) {
                                                _val = util_FormatDateTime(_val, null, null, true, { "IsValidateConversion": true });
                                            }

                                            _titleHTML += "<tr>" +
                                                          " <tr>" +
                                                          "     <td valign='top' class='Heading'>" + util_htmlEncode(_extProp["Label"]) + "</td>" +
                                                          "     <td valign='top' class='Content'>" + util_htmlEncode(_val) + "</td>" +
                                                          " </tr>" +
                                                          "</tr>";
                                        }

                                        _titleHTML += "</table>";
                                    }

                                    for (var a = 0; a < renderOpts.AttributePropertyList.length; a++) {
                                        var _attrProp = renderOpts.AttributePropertyList[a];

                                        _attr += " " + util_htmlAttribute("data-attr-offline-prop-" + _attrProp, util_forceString(_listItem[_attrProp]), null, true);
                                    }

                                    _html += "<div class='" + _itemCssClass + " Selected' " + _attr + ">" +
                                             "  <div class='Header'>" +
                                             "      <div class='Label'>" + util_htmlEncode(_syncText) + "</div>" +
                                             "      <a class='StateOn' data-role='button' data-icon='check' data-mini='true' data-inline='true' " +
                                             "data-theme='transparent' data-iconpos='notext' />" +
                                             "      <a class='StateOff' data-role='button' data-icon='delete' data-mini='true' data-inline='true' " +
                                             "data-theme='transparent' data-iconpos='notext' />" +
                                             "  </div>" +
                                             "  <div class='Title'>" + _titleHTML + "</div>" +
                                             "</div>";
                                }

                                $container.append(_html)
                                          .trigger("create");

                                setTimeout(function () {
                                    _fnRenderEntity(renderOpts, $currentTab, $container, groupIndex, _max + 1, groups, onRenderCallback);
                                }, 50);
                            }
                        };  //end: _fnRenderEntity

                        var $tabContents = $content.find(".TabView .TabContent");

                        $.each($content.find(".TabView .TabItem"), function (indx) {

                            var $tab = $(this);

                            (function () {
                                var _propTable = _list[indx];

                                _queue.Add(function (onCallback) {

                                    var _name = util_forceString(_propTable[enColCOfflineTableBaseProperty.DisplayName]);

                                    $tab.data("DataItem", _propTable)
                                        .data("TitleFormat", util_htmlEncode(_name) + "<span class='LabelCount'>" + util_htmlEncode(" | %%COUNT%%") + "</span>");

                                    var _indexName = util_forceString(_propTable[enColCOfflineTableBaseProperty.IndexName]);

                                    if (_indexName != "") {

                                        _query.Reset();

                                        _query.IndexName = "INDX_META_SYNC_TYPE";
                                        _query["_unbox"] = true;

                                        //restrict to the ID and primary key fields
                                        var _primaryKeyProp = util_forceString(_propTable[enColCOfflineTableBaseProperty.PrimaryKeyProperty]);

                                        _query.Fields = ["_id", OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE];

                                        if (_primaryKeyProp != "") {
                                            _query.Fields.push(_primaryKeyProp);
                                        }

                                        _query.Filter("TypeName", { "Type": enCOfflineFilterFunctionType.Default }, null, {
                                            "v": util_forceString(_propTable[enColCOfflineTableBaseProperty.EntityTypeName])
                                        });

                                        var _syncType = util_forceValidEnum(_propTable[enColCOfflineTableBaseProperty.SyncType], enCOfflineDataSync, enCOfflineDataSync.None, true);

                                        switch (_syncType) {

                                            case enCOfflineDataSync.Insert:
                                                _query.Filter(OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE, { "Type": enCOfflineFilterFunctionType.Default }, null, { "v": _syncType });
                                                break;

                                            case enCOfflineDataSync.Update:
                                                _query.Filter(OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE, { "Type": enCOfflineFilterFunctionType.In }, null,
                                                              { "v": [enCOfflineDataSync.Insert, enCOfflineDataSync.Update] });
                                                break;

                                            case enCOfflineDataSync.All:

                                                //do nothing since want all records
                                                break;

                                            default:
                                                _query.Filter(_primaryKeyProp, { "Type": enCOfflineFilterFunctionType.Invalid });
                                                break;
                                        }

                                        _query.Execute(function (searchList) {

                                            var _fnSetDetailView = function (dataList, numItems) {

                                                var _data = (dataList || []);

                                                _data = (_data || []);

                                                var $detailView = $($tabContents.get(indx)).children(".DetailView");

                                                $detailView.empty();

                                                var _renderOptions = {
                                                    "PropertyTitle": _propTable[enColCOfflineTableBaseProperty.PropertyTitle],
                                                    "TableDefinition": _propTable,
                                                    "ExtPropertyList": [],
                                                    "AttributePropertyList": []
                                                };

                                                if (util_forceString(_propTable[enColCOfflineTableBaseProperty.PropertyDateAdded]) != "") {
                                                    _renderOptions.ExtPropertyList.push({
                                                        "Label": "Date Created:", "Property": _propTable[enColCOfflineTableBaseProperty.PropertyDateAdded],
                                                        "IsDateTime": true
                                                    });
                                                }

                                                if (util_forceString(_propTable[enColCOfflineTableBaseProperty.PropertyDateModified]) != "") {
                                                    _renderOptions.ExtPropertyList.push({
                                                        "Label": "Last Modified:", "Property": _propTable[enColCOfflineTableBaseProperty.PropertyDateModified],
                                                        "IsDateTime": true
                                                    });
                                                }

                                                if (util_forceString(_propTable[enColCOfflineTableBaseProperty.PrimaryKeyProperty]) != "") {
                                                    _renderOptions.AttributePropertyList.push(_propTable[enColCOfflineTableBaseProperty.PrimaryKeyProperty]);
                                                }

                                                if (_propTable[enColCOfflineTableBaseProperty.DataAttributePropertyList]) {
                                                    var _attrList = _propTable[enColCOfflineTableBaseProperty.DataAttributePropertyList];

                                                    for (var a = 0; a < _attrList.length; a++) {
                                                        _renderOptions.AttributePropertyList.push(_attrList[a]);
                                                    }
                                                }

                                                var _fn = function (arrGroup) {

                                                    var _groups = [];

                                                    var _defaultGroup = { "n": "Updates", "d": [], "hideTitle": true };
                                                    var _tableGroups = (_propTable[enColCOfflineTableBaseProperty.Groups] || []);

                                                    _groups.push(_defaultGroup);

                                                    if (_tableGroups.length > 0) {
                                                        var _handled = {};

                                                        var _fnPopulateGroupData = function (grp, prop, searchValue) {

                                                            var _hasProp = (util_forceString(prop) != "");

                                                            for (var i = 0; i < _data.length; i++) {
                                                                var _dataItem = _data[i];

                                                                if (!_handled[i] && (_hasProp ? _dataItem[prop] == searchValue : true)) {

                                                                    _handled[i] = true;
                                                                    grp.d.push(_dataItem);
                                                                }
                                                            }

                                                        };  //end: _fnPopulateGroupData

                                                        for (var g = 0; g < _tableGroups.length; g++) {
                                                            var _tblGroup = _tableGroups[g];

                                                            var _group = { "n": null, "d": [], "hideTitle": false };

                                                            _group.n = _tblGroup[enColCOfflineTableGroupProperty.Heading];
                                                            _group.hideTitle = _tblGroup[enColCOfflineTableGroupProperty.IsHideHeading];

                                                            if (_data && _tblGroup[enColCOfflineTableGroupProperty.PropertyGroupBy]) {
                                                                var _prop = _tblGroup[enColCOfflineTableGroupProperty.PropertyGroupBy];
                                                                var _searchValue = _tblGroup[enColCOfflineTableGroupProperty.MatchValue];

                                                                _fnPopulateGroupData(_group, _prop, _searchValue);
                                                            }

                                                            _groups.push(_group);
                                                        }

                                                        //configure all other items not handled into the default group
                                                        _fnPopulateGroupData(_defaultGroup, null);
                                                    }
                                                    else {
                                                        _defaultGroup.d = _data;
                                                    }

                                                    if (arrGroup) {
                                                        $.merge(_groups, arrGroup);
                                                    }

                                                    //construct and persist the full set of the data (merged from all groups and in the order that it is rendered)
                                                    var _dataList = [];

                                                    for (var g = 0; g < _groups.length; g++) {
                                                        var _group = _groups[g];

                                                        $.merge(_dataList, _group["d"] || []);
                                                    }

                                                    $tab.data("SourceDataList", _dataList);

                                                    if (util_forceString(_propTable[enColCOfflineTableBaseProperty.RenderViewID]) != "") {
                                                        $tab.attr("data-attr-tab-render-view-id", _propTable[enColCOfflineTableBaseProperty.RenderViewID]);
                                                    }

                                                    _fnRenderEntity(_renderOptions, $tab, $detailView, 0, 0, _groups, function () {

                                                        $tab.trigger("events.offlinePopup_setTabTitle");

                                                        $tab.removeClass("Disabled");
                                                        onCallback();
                                                    });

                                                };  //end: _fn

                                                if (_syncType == enCOfflineDataSync.Update || _syncType == enCOfflineDataSync.All) {

                                                    //retrieve the deleted entries from the archives
                                                    _query.Reset();

                                                    _query.IndexName = "INDX_META_ARCHIVE";
                                                    _query["_unbox"] = true;

                                                    //filter for current entity type for the archives
                                                    _query.Filter(enColCOfflineArchiveProperty.ArchiveTypeName, { "Type": enCOfflineFilterFunctionType.Default }, null, {
                                                        "v": util_forceString(_propTable[enColCOfflineTableBaseProperty.EntityTypeName])
                                                    });

                                                    _query.Execute(function (archives) {

                                                        var _groups = null;

                                                        if (archives && archives.length > 0) {
                                                            var _deletedList = [];

                                                            for (var a = 0; a < archives.length; a++) {
                                                                var _archive = archives[a];
                                                                var _deletedItem = _archive[enColCOfflineArchiveProperty.DataItem];

                                                                _deletedItem["_IsArchive"] = true;    //set flag item is being retrieved from archive
                                                                _deletedItem["_DateDeleted"] = _archive[enColCOfflineArchiveProperty.Created];

                                                                _deletedList.push(_deletedItem);
                                                            }

                                                            _groups = [{ "n": "Deleted", "d": _deletedList, "itemCssClass": "Deleted" }];
                                                        }

                                                        _fn(_groups);
                                                    });
                                                }
                                                else {
                                                    _fn(null);
                                                }
                                            };

                                            searchList = (searchList || []);

                                            if (searchList.length == 0) {
                                                _fnSetDetailView();
                                            }
                                            else {

                                                var _arrID = [];

                                                _query.Reset();

                                                _query["_unbox"] = false;

                                                if (_primaryKeyProp != "") {
                                                    _query.IndexName = _indexName;
                                                }
                                                else {

                                                    if (_indexName != "") {
                                                        _query.IndexName = _indexName;
                                                    }
                                                    else {
                                                        _query.IndexName = "INDX_META_SYNC_TYPE";
                                                    }

                                                    _query.Filter("TypeName", { "Type": enCOfflineFilterFunctionType.Default }, null, {
                                                        "v": util_forceString(_propTable[enColCOfflineTableBaseProperty.EntityTypeName])
                                                    });
                                                }

                                                var _hasPrimaryKey = (_primaryKeyProp != "");

                                                for (var i = 0; i < searchList.length; i++) {
                                                    var _item = searchList[i];
                                                    var _id = null;

                                                    if (_hasPrimaryKey) {
                                                        _id = _item[_primaryKeyProp];
                                                    }
                                                    else {
                                                        _id = _item["_id"]; //use offline database generated ID
                                                    }

                                                    _arrID.push(_id);
                                                }

                                                _query.Filter((_hasPrimaryKey ? _primaryKeyProp : "_id"), { "Type": enCOfflineFilterFunctionType.In }, null, { "v": _arrID });

                                                _query.Execute(ext_requestSuccess(function (result) {
                                                    _fnSetDetailView(result ? result.List : null, result ? result["NumItems"] : null);
                                                }));
                                            }

                                        });

                                    }
                                    else {
                                        util_logError("Index name required for sync - EntityTypeName : " + _propTable[enColCOfflineTableBaseProperty.EntityTypeName]);
                                        $tab.removeClass("Disabled");
                                        onCallback();
                                    }

                                });

                            }());
                        });

                        _queue.Run({
                            "Callback": function () {

                                var _foundTabResult = ($content.find(".TabItem[" + util_htmlAttribute("data-attr-tab-has-results", enCETriState.Yes) + "]:first").length > 0);
                                var $clSave = $content.find("#clSave");

                                _resultLoadTabs.HasData = _foundTabResult;

                                $mobileUtil.ButtonSetTextByElement($clSave, _foundTabResult ? _instance.Configuration.PopupSyncOffline.ButtonSave :
                                                                                              _instance.Configuration.PopupSyncOffline.ButtonDismiss);
                                $mobileUtil.ButtonUpdateIcon($clSave, _foundTabResult ? "check" : "delete");

                                $clSave.attr("data-is-dismiss-action", _foundTabResult ? enCETriState.No : enCETriState.Yes);

                                if (args.Callback) {
                                    args.Callback(_resultLoadTabs);
                                }
                            }
                        });
                    });

                    $popup.off("events.offlinePopup_toggleTabViewState");
                    $popup.on("events.offlinePopup_toggleTabViewState", ".TabView", function (e, args) {

                        e.stopPropagation();

                        var $tabView = $(this);

                        args = util_extend({ "IsEnabled": true }, args);

                        $tabView.toggleClass("Disabled", !args.IsEnabled);

                        var $overlay = $tabView.children(".DisabledOverlay");

                        if ($overlay.length == 0) {
                            $overlay = $("<div class='DisabledOverlay' />");
                            $tabView.append($overlay);
                        }

                        $overlay.toggle(!args.IsEnabled);

                        return false;
                    });

                    $popup.off("events.offlinePopup_render");
                    $popup.on("events.offlinePopup_render", function () {

                        $popup.removeData("Token");

                        APP.Service.Action({ "c": "OfflineDatabase", "m": "SyncTableList", "args": null }, function (propList) {

                            var _propList = (propList || []);

                            if (_propList.length == 0) {

                                //do nothing since there is no data to be synced
                                $popup.trigger("events.offlinePopup_finish", { "IsCleanup": true });
                            }
                            else {

                                var _html = "";
                                var $container = $("<div class='PopupDetail' />");

                                var _popupScreenConfig = _instance.Configuration.PopupSyncOffline;

                                _html += "<div class='Title'>" + util_htmlEncode(_popupScreenConfig.Title) + "</div>";

                                var _tabContentHTML = "";

                                _html += "<div class='TabView Disabled'>";

                                for (var i = 0; i < _propList.length; i++) {
                                    var _tableProp = _propList[i];

                                    _html += "<div class='DisableUserSelectable TabItem Disabled'>" +
                                             "  <div class='Label'>" + util_htmlEncode(_tableProp[enColCOfflineTableBaseProperty.DisplayName]) + "</div>" +
                                             "</div>";

                                    _tabContentHTML += "<div class='TabContent' style='display: none;'>" +
                                                       "    <div class='Description'>" + util_htmlEncode(_tableProp[enColCOfflineTableBaseProperty.Description]) + "</div>" +
                                                       "    <div class='DetailView' />" +
                                                       "</div>";
                                }

                                var _instructionHTML = "";

                                if ((util_forceString(_popupScreenConfig.Instruction)) != "") {
                                    var _str = _popupScreenConfig.Instruction;

                                    _instructionHTML += "<div class='Instructions'>" +
                                                        (_popupScreenConfig.IsInstructionHTML ? _str : util_htmlEncdoe(_str)) +
                                                        "</div>";
                                }

                                _html += "<div class='Divider' />" +
                                         _instructionHTML + _tabContentHTML +
                                         "</div>";

                                _html += "<div class='Footer'>" +
                                         "  <div class='Label' />" +
                                         "  <a id='clSave' class='Disabled' data-role='button' data-theme='transparant' data-mini='true' data-inline='true' data-corners='false' " +
                                         "data-icon='check' data-iconpos='right'>" + util_htmlEncode(_popupScreenConfig.ButtonSave) + "</a>" +
                                         "</div>";

                                $popup.data("PropertyList", _propList);

                                $container.hide();
                                $container.html(_html);

                                $content.append($container);
                                $mobileUtil.refresh($content);

                                var $prg = $content.children(".ProgressBar");

                                $container.toggle("height", function () {
                                    $popup.trigger("events.offlinePopup_loadTabs", {
                                        "Callback": function (result) {

                                            $container.find(".TabView.Disabled")
                                                      .removeClass("Disabled");

                                            var $clSave = $container.find("#clSave");

                                            $clSave.removeClass("Disabled");

                                            $clSave.off("click.dismiss");
                                            $clSave.on("click.dismiss", function (e, args) {

                                                args = util_extend({ "IsPrompt": true, "IsNoData": false, "IsExit": false }, args);

                                                var $tabView = $container.find(".TabView");

                                                var _callback = function (isDismiss) {

                                                    $clSave.removeClass("ui-disabled");

                                                    $popup.trigger("events.offlinePopup_setSaveMessage", { "Message": null });

                                                    if (isDismiss) {
                                                        $popup.trigger("events.offlinePopup_finish", { "IsCleanup": true });
                                                    }

                                                };

                                                $clSave.addClass("ui-disabled");
                                                $tabView.trigger("events.offlinePopup_toggleTabViewState", { "IsEnabled": false });

                                                if (util_forceInt($clSave.attr("data-is-dismiss-action"), enCETriState.None) == enCETriState.Yes) {
                                                    args.IsPrompt = _instance.Configuration.PopupSyncOffline.IsPromptOnDismiss;
                                                    args.IsNoData = true;
                                                }

                                                if (args.IsExit) {
                                                    args.IsPrompt = false;
                                                    args.IsNoData = true;
                                                }

                                                if (args.IsPrompt && _instance.Configuration.ConfirmOnSave) {

                                                    dialog_confirmYesNo("Sync", "Are you sure you want to sync the selected changes?", function () {

                                                        //refresh session and check if user needs to login
                                                        ext_refreshUserSessionDetail(function () {

                                                            var _loggedIn = global_userLoggedIn();

                                                            if (!_loggedIn && !args.IsNoData) {

                                                                //retrieve the user ID from the cache
                                                                _instance.Events.GetAuthUserID({
                                                                    "OnSuccess": ext_requestSuccess(function (cacheUser) {

                                                                        $popup.trigger("events.offlinePopup_renderLoginPrompt", {
                                                                            "CacheUser": cacheUser,
                                                                            "Callback": function () {

                                                                                //prompt the user to log in
                                                                                $tabView.trigger("events.offlinePopup_toggleTabViewState", { "IsEnabled": true });
                                                                                _callback(false);

                                                                            }
                                                                        });
                                                                    })
                                                                });
                                                            }
                                                            else {
                                                                $popup.trigger("events.offlinePopup_save", { "Trigger": $clSave, "Callback": _callback });
                                                            }
                                                        });
                                                    }, function () {
                                                        $tabView.trigger("events.offlinePopup_toggleTabViewState", { "IsEnabled": true });
                                                        _callback(false);
                                                    });
                                                }
                                                else {
                                                    $popup.trigger("events.offlinePopup_save", { "Trigger": $clSave, "IsNoData": args.IsNoData, "Callback": _callback });
                                                }

                                            }); //end: click.dismiss

                                            $container.find(".TabView .TabItem:first").trigger("click.offlinePopup_viewTab");

                                            $prg.fadeOut("normal");

                                            if (result && !result.HasData && !global_userLoggedIn()) {
                                                $clSave.trigger("click.dismiss", { "IsPrompt": false, "IsNoData": true });
                                            }
                                        }
                                    });
                                });
                            }
                        });

                    }); //end: events.offlinePopup_render

                    $popup.off("events.offlinePopup_applyToggleActions");
                    $popup.on("events.offlinePopup_applyToggleActions", function (e, args) {

                        e.stopPropagation();

                        args = util_extend({ "Tab": null, "TriggerDetail": null }, args);

                        var $tab = $(args.Tab);
                        var $detail = $(args.TriggerDetail);

                        if ($detail.length == 0) {
                            $detail = $(e.target).filter(".DetailItem");
                        }

                        var _selected = $detail.hasClass("Selected");

                        var _propTable = $tab.data("DataItem");
                        var _toggleActions = _propTable[enColCOfflineTableBaseProperty.ToggleActions];

                        if (_toggleActions && _toggleActions.length > 0) {

                            var $tabs = $content.find(".TabView .TabItem");
                            var $tabContents = $content.find(".TabView .TabContent");
                            var _lookupView = {};

                            for (var a = 0; a < _toggleActions.length; a++) {
                                var _action = _toggleActions[a];
                                var _isOnSelected = _action[enColCOfflineTableToggleActionProperty.IsOnSelected];

                                if (_isOnSelected === null || (_isOnSelected === _selected)) {
                                    var _refViewID = util_forceString(_action[enColCOfflineTableToggleActionProperty.ReferenceViewID]);
                                    var _selectors = (_action[enColCOfflineTableToggleActionProperty.Selectors] || []);

                                    if (_refViewID != "" && _selectors.length > 0) {
                                        var _validSelector = true;
                                        var _strFilterSelector = "";

                                        for (var s = 0; _validSelector && s < _selectors.length; s++) {
                                            var _selector = _selectors[s];

                                            var _propItemValue = util_forceString(_selector[enColCOfflineTableDetailSelectorProperty.PropertyItemValue]);
                                            var _propSearchValue = util_forceString(_selector[enColCOfflineTableDetailSelectorProperty.PropertySearch]);

                                            if (_propItemValue != "" && _propSearchValue != "") {
                                                var _val = $detail.attr("data-attr-offline-prop-" + _propItemValue);

                                                if (!util_isNullOrUndefined(_val)) {
                                                    _strFilterSelector += "[" + util_htmlAttribute("data-attr-offline-prop-" + _propSearchValue, _val) + "]";
                                                }
                                                else {
                                                    _validSelector = false;
                                                }
                                            }
                                            else {
                                                _validSelector = false;
                                            }
                                        }

                                        if (!_validSelector) {
                                            util_logError("Malformed selector found at index: " + s + " | toggle action list index: " + a);
                                        }
                                        else {

                                            var _view = _lookupView[_refViewID];

                                            if (!_lookupView[_refViewID]) {
                                                _view = { "Index": -1, "Tab": null, "Content": null };

                                                _view.Tab = $tabs.filter("[" + util_htmlAttribute("data-attr-tab-render-view-id", _refViewID) + "]:first");
                                                _view.Index = $tabs.index(_view.Tab);
                                                _view.Content = $($tabContents.get(_view.Index));

                                                _lookupView[_refViewID] = _view;
                                            }

                                            var $searchRefList = _view.Content.find(".DetailView .DetailItem" + _strFilterSelector);

                                            $searchRefList.toggleClass("Selected", _selected);
                                        }
                                    }
                                }
                            }

                            for (var _key in _lookupView) {
                                var _view = _lookupView[_key];

                                _view.Tab.trigger("events.offlinePopup_setTabTitle");
                            }
                        }

                        return false;

                    }); //end: events.offlinePopup_applyToggleActions

                    $popup.off("events.offlinePopup_getSelections");
                    $popup.on("events.offlinePopup_getSelections", ".TabView", function (e, args) {

                        args = util_extend({ "Callback": null }, args);

                        var $this = $(this);
                        var $tabs = $this.children(".TabItem");
                        var $tabContents = $this.children(".TabContent");

                        var _ret = [];

                        $.each($tabs, function (index) {
                            var $tab = $(this);
                            var _item = {
                                "TabIndex": index, "TableDefinition": $tab.data("DataItem"),
                                "Tab": $tab, "Content": null,
                                "DataList": ($tab.data("SourceDataList") || []),
                                "Selections": [],
                                "NumAvailable": 0
                            };

                            _item.Content = $($tabContents.get($tabs.index($tab)));

                            var $details = _item.Content.find(".DetailItem[data-attr-detail-index]");

                            _item.NumAvailable = $details.length;

                            $.each($details.filter(".Selected"), function () {

                                var $detail = $(this);

                                var _selectedItem = {
                                    "Element": $detail,
                                    "Index": util_forceInt($detail.attr("data-attr-detail-index"), -1),
                                    "Data": null,
                                    "IsDeleted": $detail.hasClass("Deleted")
                                };

                                if (_selectedItem.Index >= 0 && _selectedItem.Index < _item.DataList.length) {
                                    _selectedItem.Data = _item.DataList[_selectedItem.Index];
                                }

                                _item.Selections.push(_selectedItem);
                            });

                            _ret.push(_item);
                        });

                        if (args.Callback) {
                            args.Callback(_ret);
                        }

                    }); //end: events.offlinePopup_getSelections

                    $popup.off("events.offlinePopup_save");
                    $popup.on("events.offlinePopup_save", function (e, args) {

                        args = util_extend({ "Trigger": null, "IsNoData": false, "Callback": function (isDismiss) { } }, args);

                        var $tabView = $popup.find(".TabView");

                        var _fnSetMessage = function (msg) {
                            $popup.trigger("events.offlinePopup_setSaveMessage", { "Message": msg });
                        };

                        var _fnSyncChanges = function (opts) {

                            opts = util_extend({ "SummaryList": null }, opts);

                            var _token = $popup.data("Token");
                            var _extDetail = _token[enColCEOfflineSyncTokenProperty.ExtDetail];

                            var _summaryList = opts.SummaryList;

                            //NOTE: this function must be declared on project level for the sync process to continue (required)
                            private_offlineDatabaseSyncAction({
                                "Token": _token,
                                "SourceExtDetail": _extDetail,
                                "Type": "populate",
                                "Params": {
                                    "SummaryList": opts.SummaryList
                                },
                                "Callback": function () {

                                    if (args.IsNoData) {

                                        //invalidate the token (to disregard any selections and disable the save)
                                        _token = null;
                                    }

                                    APP.Service.Action({
                                        "c": "OfflineDatabase", "m": "OfflineSyncTokenSave",
                                        "args": { "Item": util_stringify(_token), "DeepSave": true }
                                    }, function (saveData) {

                                        _token = saveData;
                                        $popup.data("Token", _token); //update the saved token

                                        var _queue = new CEventQueue();

                                        if (!args.IsNoData) {
                                            for (var s = 0; s < _summaryList.length; s++) {

                                                (function () {
                                                    var _summary = _summaryList[s];

                                                    _queue.Add(function (onCallback) {

                                                        var _list = [];

                                                        for (var d = 0; d < _summary.Selections.length; d++) {
                                                            var _selection = _summary.Selections[d];

                                                            if (!_selection.IsDeleted) {
                                                                _list.push(_selection.Data);
                                                            }
                                                        }

                                                        var _tblDef = _summary.TableDefinition;
                                                        var _token = $popup.data("Token");

                                                        _fnSetMessage("Saving changes for " + _tblDef[enColCOfflineTableBaseProperty.DisplayName] + "...");

                                                        var _tblSaveData = { "List": _list };

                                                        private_offlineDatabaseSyncAction({
                                                            "Token": _token,
                                                            "Type": "getEntitySaveList",
                                                            "Params": {
                                                                "Container": $popup,
                                                                "SummaryItem": _summary,
                                                                "SummaryList": _summaryList,
                                                                "SaveData": _tblSaveData
                                                            },
                                                            "Callback": function () {

                                                                APP.Service.Action({
                                                                    "c": "OfflineDatabase", "m": "SaveOfflineEntityList",
                                                                    "args": {
                                                                        "Token": _token, "TableDefinition": _tblDef, "Data": util_stringify(_tblSaveData.List)
                                                                    }
                                                                }, function (saveResult) {

                                                                    private_offlineDatabaseSyncAction({
                                                                        "Token": _token,
                                                                        "Type": "onSaveEntity",
                                                                        "Params": {
                                                                            "SummaryList": _summaryList,
                                                                            "SummaryItem": _summary,
                                                                            "SourceList": _list,
                                                                            "SaveResult": saveResult
                                                                        },
                                                                        "Callback": function () {

                                                                            $popup.data("Token", _token);   //must persist the token data item (due to changes)
                                                                            onCallback();
                                                                        }
                                                                    });

                                                                }, function (status, error, msg) {

                                                                    var _str = "<div style='font-weight: bold; margin-bottom: 0.5em;'>" +
                                                                               util_htmlEncode(MSG_CONFIG.UnexpectedError) +
                                                                               "</div>";
                                                                    var _details = (status ? status["responseText"] : "NA");

                                                                    _str += util_htmlEncode("Error Msg: \"" + error + "\", Details: \"" + _details + "\"");

                                                                    util_alert(_str, "Error", null, true);

                                                                    _fnSetMessage(null);

                                                                    args.Callback(false);
                                                                });

                                                            }
                                                        });

                                                    });

                                                })();
                                            }
                                        }

                                        _queue.Run({
                                            "Callback": function () {

                                                _fnSetMessage(null);

                                                $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": 0 }, function () {

                                                    $(args.Trigger).hide();

                                                    $tabView.toggle("height").promise()
                                                        .done(function () {

                                                            if (args.IsNoData) {
                                                                args.Callback(true);
                                                            }
                                                            else {
                                                                var $temp = $("<div>" +
                                                                              " <a data-role='button' data-icon='info' data-iconpos='notext' data-inline='true' " +
                                                                              "data-theme='transparent' data-mini='true' style='margin-right: 0.25em;' />" +
                                                                              util_htmlEncode("Changes have been successfully synced.") +
                                                                              "</div>");

                                                                $content.append($temp);
                                                                $temp.trigger("create");

                                                                setTimeout(function () {
                                                                    args.Callback(true);
                                                                }, 2000);
                                                            }
                                                        });

                                                });

                                            }
                                        });
                                    });

                                }
                            });

                        };  //end: _fnSyncChanges

                        _fnSetMessage("Loading selection details for sync...");

                        $tabView.trigger("events.offlinePopup_getSelections", {
                            "Callback": function (summaries) {

                                var _numSelected = 0;
                                var _numAvailable = 0;

                                for (var i = 0; i < summaries.length; i++) {
                                    var _tabSummary = summaries[i];

                                    _numSelected += _tabSummary.Selections.length;
                                    _numAvailable += _tabSummary.NumAvailable;
                                }

                                //check a sync token exists
                                var _token = $popup.data("Token");

                                if (!_token) {

                                    APP.Service.Action({
                                        "c": "OfflineDatabase", "m": "OnSyncRequestStart",
                                        "args": {
                                            "NumDataSelection": _numSelected, "NumDataAvailable": _numAvailable,
                                            "DebugTokenID": _instance.Configuration.DebugOfflineSyncTokenID
                                        }
                                    }, function (token) {

                                        //check if user is currently not logged in (if null token is returned)
                                        if (token == null) {
                                            token = new CEOfflineSyncToken();
                                        }

                                        $popup.data("Token", token);

                                        _fnSyncChanges({ "SummaryList": summaries });
                                    });

                                }
                                else {

                                    //token exists so perform the sync
                                    _token[enColOfflineSyncTokenProperty.NumSelection] = _numSelected;
                                    _token[enColOfflineSyncTokenProperty.NumAvailable] = _numAvailable;

                                    _fnSyncChanges({ "SummaryList": summaries });
                                }
                            }
                        });

                    }); //end: events.offlinePopup_save

                    $popup.off("events.offlinePopup_setSaveMessage");
                    $popup.on("events.offlinePopup_setSaveMessage", function (e, args) {

                        args = util_extend({ "Message": null }, args);

                        var $lbl = $popup.data("lblSaveMessage");

                        if (!$lbl || $lbl.length == 0) {
                            $lbl = $popup.find(".PopupDetail > .Footer > .Label:first");
                            $popup.data("lblSaveMessage", $lbl);
                        }

                        $lbl.text(util_forceString(args.Message));

                    });

                    $popup.off("events.offlinePopup_renderLoginPrompt");
                    $popup.on("events.offlinePopup_renderLoginPrompt", function (e, args) {

                        args = util_extend({ "CacheUser": null, "Callback": null }, args);

                        var $vw = $content.children(".LoginDetailView");
                        var _user = util_extend({ "UserID": enCE.None }, args.CacheUser);

                        if ($vw.length == 0) {

                            var _passwordLength = util_forceInt("%%TOK|ROUTE|OfflineDatabase|LoginPasswordMaxLength%%", 0);

                            $vw = $("<div class='LoginDetailView'>" +
                                    "   <div class='Title'>" + util_htmlEncode("Login") + "</div>" +
                                    "   <div class='Label'>" + util_htmlEncode("Username:") + "</div>" +
                                    "   <div class='Content'>" + "<span id='lblUsername' />" + "</div>" +
                                    "   <br />" +
                                    "   <div class='Label'>" + util_htmlEncode("Password:") + "</div>" +
                                    "   <div class='Content'>" +
                                    "       <input data-login-input='password' type='password' data-corners='false' data-mini='true' autocomplete='new-password' " +
                                    (_passwordLength > 0 ? util_htmlAttribute("maxlength", _passwordLength) : "") + "/>" +
                                    "   </div>" +
                                    "   <div class='Footer'>" +
                                    "       <a data-login-action='dismiss' data-role='button' data-theme='transparant' data-mini='true' data-inline='true' " +
                                         "data-corners='false' data-icon='delete' data-iconpos='right'>" + util_htmlEncode("Cancel") + "</a>" +
                                    "       <a data-login-action='submit' data-role='button' data-theme='transparant' data-mini='true' data-inline='true' " +
                                         "data-corners='false' data-icon='arrow-r' data-iconpos='right'>" + util_htmlEncode("Login") + "</a>" +
                                    "   </div>" +                                    
                                    "   <div class='Footer'>" +
                                    "       <div class='LabelInstruction'>" +
                                    "           <a data-role='button' data-inline='true' data-icon='info' data-iconpos='notext' data-theme='transparent' " +
                                    "style='cursor: default; margin-left: 0em;' />" +
                                    "           <span class='Label'>" + util_htmlEncode("If you are unable to login and would like to exit by disregarding all changes for sync, ") +
                                            util_htmlEncode("click the 'Exit' button below.") + "</span>" +
                                    "       </div>" +
                                    "       <a data-login-action='exit' data-role='button' data-theme='transparant' data-mini='true' data-inline='true' " +
                                    "data-corners='false' data-icon='delete' data-iconpos='right'>" + util_htmlEncode("Exit") + "</a>" +
                                    "   </div>" +
                                    "</div>");

                            $content.append($vw);
                            $mobileUtil.refresh($vw);

                            $vw.off("click.offlinePopup_loginPromptClick");
                            $vw.on("click.offlinePopup_loginPromptClick", "[data-login-action]:not(.Disabled)", function () {

                                var $btn = $(this);
                                var _action = $btn.attr("data-login-action");

                                var _clickCallback = function () {
                                    $btn.removeClass("Disabled");
                                };

                                $btn.addClass("Disabled");

                                switch (_action) {

                                    case "dismiss":
                                    case "exit":

                                        var _fn = function (isContinue) {

                                            isContinue = util_forceBool(isContinue, false);

                                            $popup.toggleClass("InlineLoginPrompt", isContinue);
                                            _clickCallback();
                                        };

                                        if (_action == "exit") {
                                            dialog_confirmYesNo("Exit Sync", "Are you sure you want to disregard all offline changes and exit?", function () {

                                                var $clSave = $content.find("#clSave");

                                                $clSave.attr("data-is-dismiss-action", enCETriState.Yes);   //force no dismiss action

                                                _fn();

                                                //trigger dismiss with exit
                                                $clSave.trigger("click.dismiss", { "IsExit": true });

                                            }, function () {
                                                _fn(true);
                                            });
                                        }
                                        else {
                                            _fn();
                                        }

                                        break;

                                    case "submit":

                                        var $tbPassword = $vw.find("input[data-login-input='password']");
                                        var _password = util_forceString($tbPassword.val());

                                        if (_password == "") {

                                            util_alert("Password is required.", "Login");
                                            _clickCallback();
                                        }
                                        else {

                                            var _user = util_extend({}, $vw.data("User"));

                                            var _fnToggleInput = function (enabled) {
                                                $tbPassword.textinput(enabled ? "enable" : "disable");
                                            };

                                            _fnToggleInput(false);

                                            APP.Service.Action({
                                                "c": "OfflineDatabase", "m": "LoginCacheUserByPassword",
                                                "args": { "UserID": util_forceInt(_user["UserID"], enCE.None), "Password": _password }
                                            }, function (loginResult) {

                                                loginResult = util_forceInt(loginResult, enCLoginActionResultType.None);

                                                _fnToggleInput(true);

                                                if (loginResult != enCLoginActionResultType.Success) {
                                                    var _msg = "The password specified is invalid. Please try again.";

                                                    util_alert(_msg, "Login - Error");
                                                    _clickCallback();
                                                }
                                                else {

                                                    $tbPassword.val("");
                                                    $popup.removeClass("InlineLoginPrompt");
                                                    _clickCallback();

                                                    setTimeout(function () {

                                                        var $clSave = $content.find("#clSave");

                                                        //attempt to save again (with the prompt disabled) after user session has been restored
                                                        $clSave.trigger("click.dismiss", { "IsPrompt": false });

                                                    }, 100);
                                                }
                                            });

                                        }

                                        break;
                                }

                            });
                        }

                        $vw.data("User", _user);

                        $popup.addClass("InlineLoginPrompt");

                        APP.Service.Action({
                            "c": "OfflineDatabase", "m": "GetCacheUsername",
                            "args": { "UserID": util_forceInt(_user["UserID"], enCE.None) }
                        }, function (username) {
                            username = util_forceString(username);

                            $vw.find("#lblUsername").text(username);

                            if (args.Callback) {
                                args.Callback();
                            }

                        });

                    });
                }

                $popup.hide();
                $popup.data("OnCallback", _callback);

                $mobileUtil.AnimateSmoothScroll(null, 500, { "Top": 0 }, function () {
                    $popup.toggle("height", function () {
                        $("body").addClass("COfflineScreen");
                        $popup.trigger("events.offlinePopup_render");
                    });
                });
            }
            else {
                _callback();
            }

        },

        "IsValidVersion": function (options) {

            options = util_extend({ "Callback": null }, options);

            var _result = { "Valid": true, "Version": null, "ExpectedVersion": OFFLINE_DATABASE_CONFIGURATION.Version };

            var _callback = function () {

                if (options.Callback) {

                    if (_result.Version === undefined) {
                        _result.Valid = true;
                    }
                    else {
                        _result.Valid = (_result.Valid && (_result.Version === _result.ExpectedVersion));
                    }

                    options.Callback(_result);
                }
            };

            PRIVATE_DB.info()
                      .then(function (details) {

                          var _hasData = (details && (details.doc_count > 0 || details.update_seq > 0));

                          if (_hasData) {
                              _instance.GetByID(_instance.Configuration.DOCUMENT_ID_DB_VERSION, {
                                  "OnSuccess": function (dataVersion) {

                                      if (dataVersion && dataVersion.Data) {
                                          _instance.Utils.Log({ "Message": "DATABSE VERSION: " + util_stringify(dataVersion.Data) });
                                          _result.Version = util_forceInt(dataVersion.Data["VersionNo"], 0);
                                      }

                                      _callback();
                                  },
                                  "OnError": function () {
                                      _result.Valid = false;
                                      _result.Version = null;

                                      _callback();
                                  }
                              });
                          }
                          else {
                              _result.Valid = true;
                              _result.Version = undefined;   //unversioned new database
                              _callback();
                          }
                          
                      })["catch"](function (err) {
                          _callback();
                      });
        },

        "TagDatabaseVersion": function (options) {

            options = util_extend({ "Callback": null }, options);

            var _version = {};

            _version["_id"] = _instance.Configuration.DOCUMENT_ID_DB_VERSION;
            _version["VersionNo"] = OFFLINE_DATABASE_CONFIGURATION.Version;
            _version["CreatedOn"] = new Date();
            
            _instance.Update(_version, {
                "IsReturnResults": false,
                "OnSuccess": options.Callback, "OnError": function (err) {
                    _instance.Utils.LogError(err);

                    if (options.Callback) {
                        options.Callback();
                    }
                }
            });
        },

        //START: project override supported events

        "GetModificationKey": function (callback) {
            if (callback) {
                callback(null);
            }
        },

        "GetProjectCacheData": function (opts) {

            opts = util_extend({ "Callback": null, "OldModificationKey": null, "NewModificationKey": null }, opts);

            if (opts.Callback) {
                opts.Callback(null);
            }
        }

        //END: project override supported events
    };

    this["IsReady"] = function () {
        return (_instance["_ready"] == true);
    };

    //SQL equivalent of INSERT or UPDATE
    this["Update"] = function (saveData, options) {

        options = util_extend({ "OnSuccess": null, "OnError": null, "IsReturnResults": true, "ModificationType": null }, options);

        if (!$.isArray(saveData)) {
            if (!saveData) {
                saveData = [];
            }
            else {
                saveData = [saveData];
            }
        }

        var _transactionScopeID = _instance.Configuration.TransactionScopeID++;
        var _operationTag = "op_" + (new Date()).getTime() + "_" + _transactionScopeID;

        var _tempModifications = [];

        var _defaultModType = options.ModificationType;

        if (util_isNullOrUndefined(_defaultModType)) {
            _defaultModType = enCOfflineDataSync.Insert;
        }

        for (var i = 0; i < saveData.length; i++) {
            var _item = saveData[i];

            //check if the ID property required for insert/updates is not provided (in which case will generate a new ID)
            if (!_item["_id"]) {
                _item["_id"] = _instance.Configuration.NextUniqueID();
            }

            _item["_id"] = _instance.Utils.ForceDocumentID(_item["_id"]);

            if (!_item["_rev"]) {
                _item[OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE] = _defaultModType;
            }
            else if (!_item[OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE] || _item[OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE] === enCOfflineDataSync.None) {
                _item[OFFLINE_DATABASE_COLUMN_META_SYNC_TYPE] = enCOfflineDataSync.Update;
            }

            _item["meta_tag"] = _operationTag;
            _item["meta_index"] = i;

            var _modification = {
                "Property": {},
                "Item": _item
            };

            if (_item["TypeName"] && ENTITY_METADATA.LookupEntityTypeName[_item.TypeName]) {
                var _entityType = ENTITY_METADATA.LookupEntityTypeName[_item.TypeName];

                var _arrPropExclude = (_entityType["NonSerializedPropertyList"] || []);

                for (var p = 0; p < _arrPropExclude.length; p++) {
                    var _prop = _arrPropExclude[p];

                    if (_item[_prop] !== undefined) {
                        _modification.Property[_prop] = _item[_prop];

                        delete _item[_prop];
                    }
                }
            }

            _tempModifications.push(_modification);
        }

        PRIVATE_DB.bulkDocs(saveData).then(function (results) {

            for (var i = 0; i < saveData.length; i++) {
                var _item = saveData[i];

                if (!options.IsReturnResults) {
                    delete _item["meta_tag"];
                    delete _item["meta_index"];
                }

                _instance.Utils.LookupNameField.ApplyItem(_item, null, null, true);
            }

            if (options.OnSuccess) {

                if (!options.IsReturnResults) {

                    if (options.OnSuccess) {
                        options.OnSuccess();
                    }

                    return;
                }

                //response is successful so call the get method to retrieve the updated items with the revision details (required)
                _instance.SelectExt({
                    "Matches": [{ "prop": "meta_tag", "v": _operationTag }],
                    "OnSuccess": ext_requestSuccess(function (data) {
                        var _result = new CServiceResult();

                        //the order of the returned list may have changed so use the temp modifications list to restore the proper order and applicable updates
                        var _list = (data && data.List ? data.List : []);

                        if ($.isArray(_list)) {
                            var _tempList = [];

                            var _lookup = {};

                            for (var i = 0; i < _list.length; i++) {
                                var _item = _list[i];
                                var _index = _item["meta_index"];

                                delete _item["meta_tag"];
                                delete _item["meta_index"];

                                _lookup[_index] = _item;
                            }

                            for (var i = 0; i < _tempModifications.length; i++) {
                                if (_lookup[i]) {
                                    var _item = _lookup[i];
                                    var _modification = _tempModifications[i];
                                    
                                    for (var _prop in _modification.Property) {
                                        _item[_prop] = _modification.Property[_prop];
                                    }

                                    _instance.Utils.RestoreDateFields(_item);

                                    _tempList.push(_item);
                                }
                                else if (_list.length > 0) {
                                    util_logError("Update :: missing mapped index item of - " + i + " | " + util_stringify(_lookup));
                                }
                            }

                            data.List = _tempList;
                        }

                        _result[enColCServiceResultProperty.Data] = data;

                        options.OnSuccess(_result);
                    })
                });

            }

        })["catch"](function (err) {

            _instance.Utils.LogError(err);

            if (options.OnError) {
                options.OnError(_instance.Utils.ConvertErrorToServiceResult(err));
            }

        });

    };  //end: Update


    //SQL equivalent of DELETE
    this["Delete"] = function (deleteData, options) {

        options = util_extend({ "IsArchive": true, "OnSuccess": null, "OnError": null }, options);

        var _documents = [];

        if (!$.isArray(deleteData)) {
            if (!deleteData) {
                deleteData = [];
            }
            else {
                deleteData = [deleteData];
            }
        }

        var _isArchiveTransaction = util_forceBool(options.IsArchive, true);
        var _archives = [];
        var _fnForceStringValue = function (val) {
            return (val === undefined ? null : val);
        };

        var _fnArchive = function (onArchiveCallback) {

            if (!_isArchiveTransaction || _archives.length == 0) {
                onArchiveCallback();
            }
            else {
                _instance.Update(_archives, {
                    "IsReturnResults": false, "ModificationType": enCOfflineDataSync.None, "OnSuccess": onArchiveCallback, "OnError": onArchiveCallback
                });
            }

        };  //end: _fnArchive

        for (var i = 0; i < deleteData.length; i++) {
            var _item = deleteData[i];
            var _deleteDoc = {};

            _deleteDoc["_id"] = _item["_id"];
            _deleteDoc["_rev"] = _item["_rev"];
            _deleteDoc["_deleted"] = true;   //set flag it is to be deleted

            //archive
            var _entityTypeName = _item["TypeName"];

            if (_isArchiveTransaction && _entityTypeName && ENTITY_METADATA.LookupArchivableConfiguration[_entityTypeName]) {

                var _validArchive = true;

                var _archiveKey = null;
                var _archiveConfig = ENTITY_METADATA.LookupArchivableConfiguration[_entityTypeName];
                var _propPrimaryKey = _archiveConfig[enColCEntityArchivableConfigurationProperty.PropertyPrimaryKey];

                if (_propPrimaryKey) {

                    if ($.isArray(_propPrimaryKey)) {

                        _archiveKey = "";

                        for (var p = 0; p < _propPrimaryKey.length; p++) {
                            var _prop = _propPrimaryKey[p];

                            _archiveKey += (p > 0 ? "_" : "") + _fnForceStringValue(_item[_prop]);
                        }
                    }
                    else {
                        _archiveKey = _fnForceStringValue(_item[_propPrimaryKey]);
                    }
                }

                if (_archiveConfig[enColCEntityArchivableConfigurationProperty.IsIdentityKey]) {

                    //for identity keys, must ensure it is an existing database data item being deleted (i.e. offline created data will not be archived)
                    _validArchive = (util_forceInt(_archiveKey, 0) > 0);
                }

                if (_validArchive) {

                    var _archive = new COfflineArchive();
                    var _archiveMode = _archiveConfig[enColCEntityArchivableConfigurationProperty.ArchiveMode];

                    var _displayName = null;
                    var _detail = null;

                    switch (_archiveMode) {

                        case enCOfflineArchiveMode.Partial:

                            _detail = {};

                            //configure detail item for archive to include the primary key and the additional properties to be captured from configuration
                            var _temp = ["TypeName"];

                            if (_propPrimaryKey) {
                                $.merge(_temp, $.isArray(_propPrimaryKey) ? _propPrimaryKey : [_propPrimaryKey]);
                            }

                            if (_archiveConfig[enColCEntityArchivableConfigurationProperty.PartialModePropertyList]) {
                                $.merge(_temp, _archiveConfig[enColCEntityArchivableConfigurationProperty.PartialModePropertyList]);
                            }

                            if (_archiveConfig[enColCEntityArchivableConfigurationProperty.PropertyName]) {
                                _temp.push(_archiveConfig[enColCEntityArchivableConfigurationProperty.PropertyName]);
                            }

                            for (var p = 0; p < _temp.length; p++) {
                                var _prop = _temp[p];

                                _detail[_prop] = _item[_prop];
                            }

                            break;  //end: Partial

                        default:

                            //full archive mode
                            _detail = util_extend({}, _item);
                            break;
                    }

                    if (_archiveConfig[enColCEntityArchivableConfigurationProperty.PropertyName]) {
                        var _propDisplayName = _archiveConfig[enColCEntityArchivableConfigurationProperty.PropertyName];

                        _displayName = _fnForceStringValue(_item[_propDisplayName]);
                    }

                    _archive[enColCOfflineArchiveProperty.ArchiveKey] = _archiveKey;
                    _archive[enColCOfflineArchiveProperty.ArchiveTypeName] = _entityTypeName;
                    _archive[enColCOfflineArchiveProperty.Created] = new Date();
                    _archive[enColCOfflineArchiveProperty.DataItem] = _detail;
                    _archive[enColCOfflineArchiveProperty.DisplayName] = _displayName;

                    _archives.push(_archive);
                }

            }

            _documents.push(_deleteDoc);
        }

        PRIVATE_DB.bulkDocs(_documents).then(function (response) {

            _fnArchive(function () {
                if (options.OnSuccess) {

                    var _data = { "Deleted": 0, "Response": response };

                    if (response) {
                        for (var r = 0; r < response.length; r++) {
                            var _itemRet = response[r];

                            if (_itemRet["ok"]) {
                                _data.Deleted++;
                            }
                        }
                    }

                    var _result = new CServiceResult();

                    _result[enColCServiceResultProperty.Data] = _data;

                    options.OnSuccess(_result);
                }
            });

        })["catch"](function (err) {

            _instance.Utils.LogError(err);

            if (options.OnError) {
                options.OnError(_instance.Utils.ConvertErrorToServiceResult(err));
            }
            
        });

    };  //end: Delete


    //SQL equivalent of SELECT with WHERE for ID
    this["GetByID"] = function (id, options) {

        options = util_extend({ "OnSuccess": null, "OnError": null, "IsErrorSuppressNotFound": true }, options);

        id = _instance.Utils.ForceDocumentID(id);

        PRIVATE_DB.get(id).then(function (doc) {

            var _result = new CServiceResult();

            _result[enColCServiceResultProperty.Data] = doc;

            if (options.OnSuccess) {
                options.OnSuccess(_result);
            }
            
        })["catch"](function (err) {

            var _result = _instance.Utils.ConvertErrorToServiceResult(err);

            //check if the error is related to non-existent (not found) data in which call success callback, if applicable
            if (options.IsErrorSuppressNotFound && _result[enColCServiceResultProperty.ErrorType] == enCEServiceErrorType.NonExistent) {

                if (options.OnSuccess) {
                    _result = new CServiceResult();

                    options.OnSuccess(_result);
                }
            }
            else if (options.OnError) {
                _instance.Utils.LogError(err);
                options.OnError(_result);
            }

        });

    };  //end: GetByID

    this["Select"] = function (options) {

        options = util_extend({
            "_index": null, //the name of the index (must be created and available in lookup via key specified); required for easier execution
            "_indicators": true,
            "_isEntityList": true,
            "Fields": null, //array of fields to restrict for populating the result; default is to return all properties
            "Filters": {},
            "PageSize": enCEPaging.NoPaging, "PageNum": enCEPaging.NoPaging,
            "SortASC": true,
            "FilterTypeName": null, //(optional) not necessary if the index name is specified
            "OnSuccess": null,
            "OnError": null
        }, options);

        var _queryOptions = { "selector": {}, "sort": [] };

        var _indexName = util_forceString(options["_index"]);

        var _isApplyLookupFields = true;
        var _isRestoreDateValues = true;
        var _entityDatePropList = null;
        var _entityTypeName = null;

        if (_indexName != "" && _instance.Configuration.LookupIndex[_indexName]) {
            var _indexOpt = _instance.Configuration.LookupIndex[_indexName];
            var _filterTypeName = util_forceString(options.FilterTypeName);

            if (_filterTypeName == "") {
                _filterTypeName = _indexOpt["_type"];
            }

            //check if there is a mapped index to use
            if (_indexOpt["_mapped"]) {
                _queryOptions["use_index"] = _indexOpt["_mapped"];
            }
            else {
                _queryOptions["use_index"] = _indexOpt["ddoc"];
            }

            var _handledFields = {};

            //NOTE: specifying that the field must be greater than or equal to null, which is a workaround for the fact that the Mango query language requires us 
            //      to have a selector; in CouchDB collation order, null is the "lowest" value, and so this will return all documents regardless of their field value.
            var DEFAULT_NO_FILTER_EXP = { $gte: null };

            var _fnGetSelectorValue = function (filterOpt) {

                var _item = util_extend({ "Type": enCOfflineFilterFunctionType.None, "SearchValue": undefined }, filterOpt);

                var _ret = _item.SearchValue;

                switch (_item.Type) {

                    case enCOfflineFilterFunctionType.Default:

                        _ret = { $eq: _ret };
                        break;

                    case enCOfflineFilterFunctionType.TextSearch:

                        _ret = util_forceString(_ret, "");

                        //only apply filter if a valid non-empty string is specified
                        if (_ret != "") {
                            _ret = { $regex: new RegExp("^" + util_regexEscape(_ret) + "$", "i") }; //case insensitive (exact match)
                        }
                        else {
                            _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                        }

                        break;

                    case enCOfflineFilterFunctionType.Identifier:
                    case enCOfflineFilterFunctionType.IdentifierNullable:

                        //support for NULL value only if nullable filter type
                        if (_item.Type == enCOfflineFilterFunctionType.Identifier ||
                            (_item.Type == enCOfflineFilterFunctionType.IdentifierNullable && _ret !== null)) {
                            _ret = util_forceInt(_ret, enCE.None);
                        }

                        //only apply the filter if a valid ID is specified (if enCE.None is specified do not filter by this field)
                        if (_ret != enCE.None) {
                            _ret = { $eq: _ret };
                        }
                        else {
                            _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                        }

                        break;

                    case enCOfflineFilterFunctionType.TriState:

                        _ret = util_forceValidEnum(_ret, enCETriState, enCETriState.None, true);

                        //only apply the filter if None is not specified
                        switch (_ret) {

                            case enCETriState.Yes:
                            case enCETriState.No:
                                _ret = { $eq: (_ret == enCETriState.Yes) };
                                break;

                            default:
                                _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                                break;

                        }

                        break;

                    case enCOfflineFilterFunctionType.Regex:

                        if (typeof _ret === "string") {
                            _ret = new RegExp(_ret);    //convert string to RegEx object
                        }

                        _ret = { $regex: _ret };
                        break;

                    case enCOfflineFilterFunctionType.RegexContains:

                        _ret = { $regex: new RegExp("^.*" + util_regexEscape(_ret) + ".*$", "i") };
                        break;

                    case enCOfflineFilterFunctionType.Invalid:

                        _ret = { $lt: null };
                        break;

                    case enCOfflineFilterFunctionType.DateRange:

                        var _vals = ($.isArray(_ret) ? _ret : [_ret]);
                        
                        _ret = null;

                        for (var v = 0; v < Math.min(_vals.length, 2); v++) {
                            var _val = _vals[v];

                            //only apply filter if a valid value is specified
                            if (_val) {

                                if (!_ret) {
                                    _ret = {};
                                }

                                if (v == 0) {
                                    _ret["$gte"] = _val;
                                }
                                else if (v == 1) {

                                    //end range is being calculated and as such must offset by adding 1 day
                                    _val.setDate(_val.getDate() + 1);

                                    _ret["$lt"] = _val; //NOTE: using less than operator since want all dates before the modified end date
                                }
                            }
                        }

                        if (_ret == null) {
                            _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                        }

                        break;  //end: DateRange

                    case enCOfflineFilterFunctionType.In:
                    case enCOfflineFilterFunctionType.NotIn:

                        if (_ret === null) {
                            _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                        }
                        else {
                            var _vals = ($.isArray(_ret) ? _ret : [_ret]);

                            if (_item.Type == enCOfflineFilterFunctionType.In) {
                                _ret = { $in: _vals };
                            }
                            else {
                                _ret = { $nin: _vals };
                            }
                        }

                        break;

                    case enCOfflineFilterFunctionType.LessThan:

                        _ret = { $lt: _ret };
                        break;

                    default:

                        if (_item.Type != enCOfflineFilterFunctionType.None) {
                            util_logError("Select :: not handled filter function type - " + _item.Type);
                        }

                        _ret = util_extend({}, DEFAULT_NO_FILTER_EXP);
                        break;
                }

                return _ret;

            };  //end: _fnGetSelectorValue

            for (var f = 0; f < _indexOpt.fields.length; f++) {
                var _fieldName = _indexOpt.fields[f];
                var _val = null;

                _handledFields[_fieldName] = true;
                //filter
                _val = null;

                if (_fieldName === "TypeName") {
                    _val = _filterTypeName;

                    if (_val === undefined) {
                        _val = _fnGetSelectorValue(options.Filters["TypeName"]);

                        if (_val) {
                            for (var _p in _val) {
                                _filterTypeName = _val[_p];
                                break;
                            }
                        }
                    }
                }
                else if (options.Filters) {
                    _val = _fnGetSelectorValue(options.Filters[_fieldName]);
                }

                _queryOptions.selector[_fieldName] = _val;

                //sort
                var _sortField = {};

                _sortField[_fieldName] = (options.SortASC ? "asc" : "desc");

                _queryOptions.sort.push(_sortField);
            }

            //custom filters
            if (options.Filters) {

                for (var _key in options.Filters) {

                    if (!_handledFields[_key]) {
                        _handledFields[_key] = true;

                        _queryOptions.selector[_key] = _fnGetSelectorValue(options.Filters[_key]);
                    }
                }
            }

            if (util_forceString(_filterTypeName) != "") {
                _entityTypeName = _filterTypeName;
            }
        }

        if (_entityTypeName) {
            _isApplyLookupFields = _instance.Utils.LookupNameField.IsForeignLookup(_entityTypeName);

            if (ENTITY_METADATA.LookupEntityTypeName[_entityTypeName]) {
                var _entityType = ENTITY_METADATA.LookupEntityTypeName[_entityTypeName];

                if ((_entityType && _entityType["DatePropertyList"] && _entityType.DatePropertyList.length > 0)) {
                    _entityDatePropList = _entityType.DatePropertyList;
                }
                else{
                    _isRestoreDateValues = false;
                }
            }
        }

        if (options.Fields && $.isArray(options.Fields)) {
            _queryOptions["fields"] = options.Fields;
        }

        options.PageSize = util_forceInt(options.PageSize, enCEPaging.NoPaging);

        if (options.PageSize != enCEPaging.NoPaging) {
            _queryOptions["limit"] = options.PageSize;

            //calculate the num records to skip
            var _skip = 0;
            var _pageNum = util_forceInt(options.PageNum, 1);

            _pageNum = Math.max(_pageNum, 1);

            _queryOptions["skip"] = (options.PageSize * (_pageNum - 1));
        }

        var _hasIndicators = (options["_indicators"] === true);

        var _fnOnError = function (err, isLogOnly) {

            _instance.Utils.LogError(err);

            if (!isLogOnly) {
                if (_hasIndicators) {
                    unblockUI();
                }

                if (options.OnError) {
                    var _result = _instance.Utils.ConvertErrorToServiceResult(err);

                    options.OnError(_result);
                }
            }

        };  //end: _fnOnError

        if (_hasIndicators) {
            blockUI();
        }

        PRIVATE_DB.find(_queryOptions)
                  .then(function (response) {

                      var _rows = response.docs;

                      var _result = new CServiceResult();
                      var _data = { "List": null, "NumItems": 0 };

                      if (_rows && (_isApplyLookupFields || _isRestoreDateValues)) {

                          for (var r = 0; r < _rows.length; r++) {
                              var _item = _rows[r];

                              if (_isApplyLookupFields) {
                                  _instance.Utils.LookupNameField.ApplyItem(_item, _entityTypeName, true);
                              }

                              if (_isRestoreDateValues) {
                                  _instance.Utils.RestoreDateFields(_item, { "Property": _entityDatePropList, "TypeName": _entityTypeName });
                              }
                          }
                      }

                      _data.List = _rows;
                      _data.NumItems = _rows.length;

                      _result[enColCServiceResultProperty.Data] = _data;

                      var _isEntityList = (options["_isEntityList"] === true);

                      var _fn = function () {

                          if (_hasIndicators) {
                              unblockUI();
                          }

                          if (options.OnSuccess) {
                              options.OnSuccess(_result);
                          }

                      };

                      if (_isEntityList) {

                          //TODO: find better approach for total rows using PouchDB find plugin (since currently total rows is not supported)
                          delete _queryOptions["limit"];
                          delete _queryOptions["skip"];

                          _queryOptions["fields"] = ["_id"];    //use a smaller subset of fields (to make it less memory intensive)

                          PRIVATE_DB.find(_queryOptions)
                                    .then(function (response) {

                                        var _rows = response.docs;

                                        _data.NumItems = _rows.length;

                                        _fn();

                                    })
                                    ["catch"](function (err) {
                                        _fnOnError(err, true);
                                        _fn();
                                    });
                      }
                      else {
                          _fn();
                      }

                  })
                  ["catch"](function (err) {
                      _fnOnError(err);
                  });

    };  //end: Select

    //SQL equivalent of SELECT (advanced mode)
    this["SelectExt"] = function (options) {

        options = util_extend({
            "IsUnboxResults": true,
            "FilterTypeName": null, "Filters": [], "Matches": [],
            "Map": null, //format: function (doc) { return true; }
            "OnSuccess": null,
            "OnError": null
        }, options);

        var _filterTypeName = util_forceString(options.FilterTypeName);
        var _hasTypeFilter = (_filterTypeName != "");
        var _map = null;

        if ($.isFunction(options.Map)) {
            _map = function (doc) {
                var _valid = true;
                var _params = window.mdb_params;

                _valid = (_valid && (!_params.HasTypeFilter || (_params.HasTypeFilter && doc.TypeName === _params.FilterTypeName)));
                _valid = (_valid && _params.Map.apply(this, [doc]));

                if (_valid) {
                    emit("m|" + doc["_id"]);
                }
            };
        }
        else {
            if (!$.isArray(options.Filters)) {
                options.Filters = [];
            }

            if ($.isArray(options.Matches)) {
                for (var m = 0; m < options.Matches.length; m++) {
                    var _config = options.Matches[m];

                    options.Filters.push(_instance.Utils.GetFilterFunction({ "Property": _config.prop, "SearchValue": _config.v }));
                }
            }

            _map = function (doc) {
                var _valid = true;
                var _params = window.mdb_params;
                var _arrFilters = _params.Filters;

                _valid = (_valid && (!_params.HasTypeFilter || (_params.HasTypeFilter && doc.TypeName === _params.FilterTypeName)));

                for (var f = 0; f < _arrFilters.length && _valid; f++) {
                    var _filter = _arrFilters[f];

                    _valid = _filter.ApplyFilter(doc);
                }

                if (_valid) {
                    emit("m|" + doc["_id"]);
                }
            };
        }

        var _globalParam = {};

        _globalParam.Map = options.Map;
        _globalParam.HasTypeFilter = _hasTypeFilter;
        _globalParam.FilterTypeName = _filterTypeName;
        _globalParam.Filters = options.Filters;

        //TODO: find an alternate no-conflict way to persist the filter parameters
        window["mdb_params"] = _globalParam;

        var _queryOptions = {
            "include_docs": true
        };

        PRIVATE_DB.query(_map, _queryOptions)
                  .then(function (response) {
                      var _rows = response.rows;

                      if (options.IsUnboxResults) {
                          var _temp = [];

                          for (var r = 0; r < _rows.length; r++) {
                              var _row = _rows[r];

                              _temp.push(_row.doc);
                          }

                          _rows = _temp;
                      }

                      var _result = new CServiceResult();
                      var _data = { "List": null, "NumItems": 0 };

                      _data.List = _rows;
                      _data.NumItems = util_forceInt(response.total_rows, 0);

                      _result[enColCServiceResultProperty.Data] = _data;

                      if (options.OnSuccess) {
                          options.OnSuccess(_result);
                      }

                  })
                  ["catch"](function (err) {

                      _instance.Utils.LogError(err);

                      if (options.OnError) {
                          var _result = _instance.Utils.ConvertErrorToServiceResult(err);

                          options.OnError(_result);
                      }

                  });

    };  //end: SelectExt

    _instance.DOM.Indicator = $("<div class='COfflineFixedPosition COfflineProgress' />");

    _instance.DOM.Indicator.html("<div class='ProgressBar'>" +
                                 "  <div class='ModeIndeterminate' />" +
                                 "</div>" +
                                 "<div class='Label' />"
                                 );

    $("body").append(_instance.DOM.Indicator);

    var _optionsInit = {
        "Instance": this,
        "ListIndexDB": [],

        "AddIndex": function (prefixIndexName, instanceType, arrFields) {

            var _list = this.ListIndexDB;

            if (!_list) {
                _list = [];
                this.ListIndexDB = _list;
            }

            arrFields = (arrFields || []);

            for (var f = 0; f < arrFields.length; f++) {
                var _prop = arrFields[f];

                _list.push({
                    "_type": instanceType,
                    "name": prefixIndexName + _prop,
                    "fields": [_prop]
                });
            }

        },

        "Callback": function () {
            _instance.Events.Init({ "Callback": opts.Callback, "ListIndexDB": this.ListIndexDB });
        }
    };

    _instance.Configuration.IsForceOfflineSync = (util_forceInt(util_queryString("IsForceOfflineSync"), enCETriState.None) == enCETriState.Yes);

    //configure the entity lookup of parent and foreign key mappings
    var _lookup = {
        "m_data": {}, "Parent": {}, "Foreign": {},
        "Init": function () {
            for (var _entityType in this.m_data) {
                var _lookup = this.m_data[_entityType];

                for (var _prop in _lookup) {
                    _lookup[_prop] = {};
                }
            }
        },
        "IsParentLookup": function (entityTypeName) {
            return (this.Parent[entityTypeName] ? true : false);
        },
        "IsForeignLookup": function (entityTypeName) {
            return (this.Foreign[entityTypeName] ? true : false);
        },        
        "ApplyItem": function (item, entityTypeName, disableParentLookup, disableForeignLookup) {
            
            if (item) {
                if (!entityTypeName) {
                    entityTypeName = item["TypeName"];
                }

                if (entityTypeName) {

                    if (!disableParentLookup && this.IsParentLookup(entityTypeName)) {
                        var _entry = this.Parent[entityTypeName];
                        var _lookupValues = this.m_data[entityTypeName];

                        for (var _prop in _entry) {
                            var _key = item[_prop];

                            if (_key) {
                                var _propValue = _entry[_prop];
                                var _temp = _lookupValues[_prop];

                                _temp[_key] = item[_propValue];
                            }
                        }
                    }
                    
                    if (!disableForeignLookup && this.IsForeignLookup(entityTypeName)) {

                        var _entry = this.Foreign[entityTypeName];

                        for (var _prop in _entry) {
                            var _detail = _entry[_prop];

                            var _propID = _detail[enColCForeignLookupFieldDetailProperty.PropertyID];
                            var _propIDName = _detail[enColCForeignLookupFieldDetailProperty.PropertyIDName];
                            var _typeName = _detail[enColCForeignLookupFieldDetailProperty.ParentType];

                            var _parentEntry = this.Parent[_typeName];
                            var _lookupValues = this.m_data[_typeName];

                            var _searchID = item[_propID];

                            if (_searchID) {
                                for (var _parentProp in _parentEntry) {

                                    var _propValues = _lookupValues[_parentProp];

                                    item[_propIDName] = (_propValues ? _propValues[_searchID] : null);
                                    break;  //exit as there should only be at most one property for the primary key ID name value
                                }
                            }
                        }
                    }
                }
            }
        },
        "Refresh": function (options) {
            
            var _this = this;

            options = util_extend({ "Callback": null }, options);

            _this.Init();

            var _queue = new CEventQueue();
            var _query = new CQuery();

            //for all parent type entity lookups initialize the values
            for (var _key in PRIVATE_OFFLINE_MANAGER.Utils.LookupNameField.Parent) {
                (function () {

                    var _entityType = _key;

                    _queue.Add(function (onCallback) {

                        var _entityLookup = PRIVATE_OFFLINE_MANAGER.Utils.LookupNameField.Parent[_entityType];

                        var _fields = [];
                        var _handled = {};

                        for (var _prop in _entityLookup) {

                            if (!_handled[_prop]) {
                                _fields.push(_prop);
                                _handled[_prop] = true;
                            }

                            var _propName = _entityLookup[_prop];

                            if (!_handled[_propName]) {
                                _fields.push(_propName);
                                _handled[_propName] = true;
                            }
                        }

                        if (_fields.length > 0) {

                            _query.Reset();

                            _query.IndexName = "INDX_META_SYNC_TYPE";
                            _query.Filter("TypeName", { "Type": enCOfflineFilterFunctionType.Default }, null, { "v": _entityType });
                            _query.Fields = _fields;

                            _query.Execute(function (list) {

                                list = (list || []);

                                for (var i = 0; i < list.length; i++) {
                                    _this.ApplyItem(list[i], _entityType, null, true);
                                }

                                onCallback();

                            });
                        }
                        else {
                            onCallback();
                        }

                    });

                }());
            }

            _queue.Run({ "Callback": options.Callback });
        }
    };

    for (var _key in ENTITY_METADATA.LookupEntityTypeName) {
        var _instanceType = ENTITY_METADATA.LookupEntityTypeName[_key];

        if (_instanceType) {
            var _prop = null;

            var _arr = [{ "p": "Parent", "Property": "ParentLookupField" }, { "p": "Foreign", "Property": "ForeignLookupField" }];

            var _temp = null;

            for (var i = 0; i < _arr.length; i++) {
                var _config = _arr[i];
                var _val = _instanceType[_config.Property];

                if (_val) {
                    var _meta = _lookup[_config.p];

                    _meta[_key] = _val;

                    if (_config.p === "Parent") {
                        if (!_temp) {
                            _temp = {};
                        }

                        for (var _p in _val) {
                            _temp[_p] = {};
                        }
                    }
                }
            }

            if (_temp) {
                _lookup.m_data[_key] = _temp;
            }

            if (_instanceType["ExtPropertyDefinitions"]) {

                var _propDefinitions = _instanceType.ExtPropertyDefinitions;

                var _filteredList = [];
                var _list = (_propDefinitions[enColCExtPropertyDefinitionsProperty.Items] || []);

                for (var i = 0; i < _list.length; i++) {
                    var _propDef = _list[i];

                    try {
                        _propDef["m_type"] = eval(_propDef[enColCExtPropertyDefinitionProperty.TypeName]);
                        _filteredList.push(_propDef);
                    } catch (e) {
                        util_logError("COfflineDatabase :: Init - instance not found for entity type property definition | " + _key +
                                      " | property definition name \"" + _propDef[enColCExtPropertyDefinitionProperty.Property] + "\"," +
                                      " type \"" + _propDef[enColCExtPropertyDefinitionProperty.TypeName] + "\"");
                    }
                }

                _propDefinitions[enColCExtPropertyDefinitionsProperty.Items] = _filteredList;
            }
        }

    }

    _instance.Utils["LookupNameField"] = _lookup;

    _instance.Events.IsValidVersion({
        "Callback": function (result) {

            var _fnInit = function () {

                if (util_isDefined("private_offlineDatabaseInstanceInit")) {
                    private_offlineDatabaseInstanceInit(_optionsInit);
                }
                else {
                    _optionsInit.Callback();
                }

            };  //end: _fnInit

            if (!result.Valid || (result.Version === null)) {

                //version exists and does not match the latest, so destroy current database and recreate it
                _instance.Events.Destroy({
                    "IsPrompt": false,
                    "IsInitOnCreate": false,
                    "Callback": function () {

                        _instance.Events.TagDatabaseVersion({ "Callback": _fnInit });
                    }
                });
            }
            else if (result.Valid && result.Version === undefined) {

                //database is valid (i.e. empty) and currently unversioned
                _instance.Events.TagDatabaseVersion({ "Callback": _fnInit });
            }
            else {
                _fnInit();
            }
        }
    });

}