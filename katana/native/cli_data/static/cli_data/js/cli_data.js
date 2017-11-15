'use strict';

var cliData = {

    fileDisplayAPI: {
        init: function() {
            var $currentPage = katana.$activeTab;
            var $displayFilesDiv = $currentPage.find('#display-files');
            var $displayErrorMsgDiv = $currentPage.find('#display-error-message');
            var $mainDiv = $currentPage.find('#main-div');
            $mainDiv.hide();
            $.ajax({
                type: 'GET',
                url: 'read_config_file/',
            }).done(function(config_json_data) {
                if(config_json_data["testdata"] === ""){
                    $displayErrorMsgDiv.show();
                    $displayFilesDiv.hide();
                } else {
                    $displayErrorMsgDiv.hide();
                    $displayFilesDiv.show();
                    $.ajax({
                           headers: {
                               'X-CSRFToken': $currentPage.find('input[name="csrfmiddlewaretoken"]').attr('value')
                           },
                           type: 'POST',
                           url: 'get_file_explorer_data/',
                           data: {"data": {"start_dir": config_json_data["testdata"]}}
                        }).done(function(data) {
                            $displayFilesDiv.jstree({
                                "core": { "data": [data]},
                                "plugins": ["search", "sort"],
                                "sort": function (a, b) {
                                            var nodeA = this.get_node(a);
                                            var nodeB = this.get_node(b);
                                            var lengthA = nodeA.children.length;
                                            var lengthB = nodeB.children.length;
                                            if ((lengthA == 0 && lengthB == 0) || (lengthA > 0 && lengthB > 0))
                                                return this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1;
                                            else
                                                return lengthA > lengthB ? -1 : 1;
                                    }
                            });
                            $displayFilesDiv.jstree().hide_dots();
                            $displayFilesDiv.on("select_node.jstree", function (e, data) {
                                if (data["node"]["icon"] == "jstree-file") {
                                    $.ajax({
                                        url: "cli_data/get_default_file/",
                                        type: "GET",
                                        data: {"path": data["node"]["li_attr"]["data-path"]},
                                        success: function(data){
                                            console.log(data);
                                        }
                                    });
                                }
                            });
                        });
                }
            });
        },

        newFile: function() {
            $.ajax({
               type: 'GET',
               url: 'cli_data/get_default_file/',
               data: {"path": false}
            }).done(function(data) {
                //console.log(data);
                var $currentPage = katana.$activeTab;
                var $displayFilesDiv = $currentPage.find('#display-files');
                $displayFilesDiv.hide();
                var $displayErrorMsgDiv = $currentPage.find('#display-error-message');
                $displayErrorMsgDiv.hide();
                var $mainDiv = $currentPage.find('#main-div');
                $mainDiv.show();
                var $toolBarDiv = $currentPage.find('.tool-bar');
                $toolBarDiv.find('.title').html(data["name"]);

                var globalCmd = new globalCommand(data.contents.data.global.command_params);
                var $content = globalCmd.htmlLeftContent;
                $($content[0]).attr("objectIndex", "0");
                $currentPage.find('.cli-data-left-column').html($content);

                setTimeout(function(){cliData.fileDisplayAPI.displayRightContents(data.contents.data)}, 1);

            });
        },

        displayRightContents: function(data){
            var $currentPage = katana.$activeTab;
            var $rightColumn = $currentPage.find('.cli-data-right-column').find('.cli-data-full-width');

            var globalCmd = new globalCommand(data.global.command_params);
            var $content = globalCmd.htmlRightContent;
            $($content[0]).attr("active", "true");
            $rightColumn.append($content);

            var globalVerHtmlContent = false;
            for(var i=0; i<data.global.verifications.length; i++){
                for(var key in data.global.verifications[i]){
                    if(data.global.verifications[i][key]["type"] == "verification"){
                        var globalVer = new globalVerifications(data.global.verifications[i])
                        if(!globalVerHtmlContent){
                            globalVerHtmlContent = globalVer.htmlRightContent;
                        } else {
                            globalVerHtmlContent = globalVer.addAnother(globalVerHtmlContent);
                        }
                    }
                    break;
                }
            }
            $rightColumn.append(globalVerHtmlContent);

            var globalCombHtmlContent = false;
            for(var i=0; i<data.global.verifications.length; i++){
                for(var key in data.global.verifications[i]){
                    if(data.global.verifications[i][key]["type"] == "combination"){
                        var globalComb = new globalCombinations(data.global.verifications[i])
                        if(!globalCombHtmlContent){
                            globalCombHtmlContent = globalComb.htmlRightContent;
                        } else {
                            globalCombHtmlContent = globalComb.addAnother(globalCombHtmlContent);
                        }
                    }
                    break;
                }
            }
            $rightColumn.append(globalCombHtmlContent);

            var globalKeysHtmlContent = false;
            for(var key in data.global.keys){
                var jsonVar = {};
                jsonVar[key] = data.global.keys[key]
                var globalRespKeys = new globalKeys(jsonVar);
                if(!globalKeysHtmlContent){
                    globalKeysHtmlContent = globalRespKeys.htmlRightContent;
                } else {
                    globalKeysHtmlContent = globalRespKeys.addAnother(globalKeysHtmlContent);
                }
            }
            $rightColumn.append(globalKeysHtmlContent);

            var globalVarPat = new globalVariablePattern(data.global.variable_pattern);
            $rightColumn.append(globalVarPat.htmlRightContent);


            for(i=0; i<data.testdata.length; i++){
                var tdCmdHtmlContent = false;
                for(var j=0; j<data.testdata[i].command.length; j++){
                    var tdCmd = new testdataCommand(data.testdata[i].command[j]);
                    if(!tdCmdHtmlContent){
                        tdCmdHtmlContent = tdCmd.htmlRightContent;
                    } else {
                        tdCmdHtmlContent = tdCmd.addAnother(tdCmdHtmlContent);
                    }
                }
                $rightColumn.append(tdCmdHtmlContent);


                var tdVerHtmlContent = false;
                for(key in data.testdata[i]){
                    if(key !== "command" && key !== "variable_pattern"){
                        if(data.testdata[i][key]["type"] == "verification"){
                            var jsonVar = {};
                            jsonVar[key] = data.testdata[i][key]
                            var tdVer = new testdataVerifications(jsonVar)
                            if(!tdVerHtmlContent){
                                tdVerHtmlContent = tdVer.htmlRightContent;
                            } else {
                                tdVerHtmlContent = tdVer.addAnother(tdVerHtmlContent);
                            }
                        }
                    }
                }
                $rightColumn.append(tdVerHtmlContent)

                var tdKeysHtmlContent = false;
                for(key in data.testdata[i]){
                    if(key !== "command" && key !== "variable_pattern"){
                        if(data.testdata[i][key]["type"] == "key"){
                            var jsonVar = {};
                            jsonVar[key] = data.testdata[i][key]
                            var tdKey = new testdataKeys(jsonVar)
                            if(!tdKeysHtmlContent){
                                tdKeysHtmlContent = tdKey.htmlRightContent;
                            } else {
                                tdKeysHtmlContent = tdKey.addAnother(tdKeysHtmlContent)
                            }
                        }
                    }
                }
                $rightColumn.append(tdKeysHtmlContent)

                var tdVarPat = new testdataVariablePattern(data.testdata[i].variable_pattern)
                $rightColumn.append(tdVarPat.htmlRightContent)
            }
        },
    },

    leftColumn: {
        nextBlock: function() {
            var $elem = $(this);
            var objectIndex = parseInt($elem.closest('.cli-data-left-column-topbar').attr('objectIndex')) + 1;
            var $currentPage = katana.$activeTab;
            var $activeElement = $currentPage.find('[active="true"]');
            var dataObj = $activeElement.data().dataObject;
            if(dataObj.length > objectIndex){
                var actualObj = dataObj[objectIndex];
                $activeElement.get(0).scrollIntoView(true);
            } else {
                objectIndex = 0;
                var $nextElem = $activeElement.next().next().next();
                $nextElem.attr('active', 'true');
                $activeElement.attr('active', 'false');
                var dataObj = $nextElem.data().dataObject;
                var actualObj = dataObj[objectIndex];
                $nextElem.get(0).scrollIntoView(true);
            }
            var $leftColumn = $currentPage.find('.cli-data-left-column');
            var $leftData = actualObj.htmlLeftContent;
            $leftData.hide();
            $leftColumn.html($leftData.fadeIn(500));
            $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", objectIndex);
        },

        previousBlock: function(){
            var $elem = $(this);
            var objectIndex = parseInt($elem.closest('.cli-data-left-column-topbar').attr('objectIndex')) - 1;
            var $currentPage = katana.$activeTab;
            var $activeElement = $currentPage.find('[active="true"]');
            var dataObj = $activeElement.data().dataObject;
            if(objectIndex >= 0){
                var actualObj = dataObj[objectIndex];
                $activeElement.get(0).scrollIntoView(true);
            } else {
                var $prevElem = $activeElement.prev().prev().prev();
                $prevElem.attr('active', 'true');
                $activeElement.attr('active', 'false');
                var dataObj = $prevElem.data().dataObject;
                objectIndex = dataObj.length - 1;
                var actualObj = dataObj[objectIndex];
                $prevElem.get(0).scrollIntoView(true);
            }
            var $leftColumn = $currentPage.find('.cli-data-left-column');
            var $leftData = actualObj.htmlLeftContent;
            $leftData.hide();
            $leftColumn.html($leftData.fadeIn(500));
            $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", objectIndex);
        },

        deleteBlock: function(){
            var $elem = $(this);
            var objectIndex = parseInt($elem.closest('.cli-data-left-column-topbar').attr('objectIndex'));
            var $currentPage = katana.$activeTab;
            var $leftColumn = $currentPage.find('.cli-data-left-column');
            var $activeElement = $currentPage.find('[active="true"]');
            var $content = $activeElement;
            $content.push($activeElement.next()[0]);
            $content.push($activeElement.next().next()[0]);
            var dataObj = $activeElement.data().dataObject;
            dataObj[objectIndex].deleteBlockElement($content, objectIndex);
            if(objectIndex < dataObj.length){
                var $leftData = dataObj[objectIndex].htmlLeftContent;
                $leftData.hide();
                $leftColumn.html($leftData.fadeIn(500));
                $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", objectIndex);
            } else if (objectIndex-1 <= dataObj.length) {
                var $leftData = dataObj[objectIndex-1].htmlLeftContent;
                $leftData.hide();
                $leftColumn.html($leftData.fadeIn(500));
                $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", objectIndex-1);
            }
        },

        duplicateBlock: function(){
            var $elem = $(this);
            var $currentPage = katana.$activeTab;
            var $activeElement = $currentPage.find('[active="true"]');
            var objectIndex = parseInt($elem.closest('.cli-data-left-column-topbar').attr('objectIndex'));
            var dataObj = $activeElement.data().dataObject;
            var $currentObject = dataObj[objectIndex];
            cliData.leftColumn.addAnotherBlock($elem, $currentObject.jsonObj)
        },

        addAnotherBlock: function(elem, data){
            if(elem !== undefined){
                var $elem = elem;
            } else {
                var $elem = $(this);
            }
            var objectIndex = parseInt($elem.closest('.cli-data-left-column-topbar').attr('objectIndex'));
            var $currentPage = katana.$activeTab;
            var $activeElement = $currentPage.find('[active="true"]');
            var $content = $activeElement;
            $content.push($activeElement.next()[0]);
            $content.push($activeElement.next().next()[0]);
            var dataObj = $activeElement.data().dataObject;
            var $currentObject = dataObj[objectIndex];
            var className = $currentObject.constructor.name;
            var newObj = false;
            if (className == "testdataCommand") {
                newObj = new testdataCommand(data);
            } else if(className == "globalVerifications"){
                newObj = new globalVerifications(data);
            } else if (className == "testdataVerifications") {
                newObj = new testdataVerifications(data);
            } else if (className == "globalCombinations") {
                newObj = new globalCombinations(data);
            } else if (className == "testdataCombinations") {
                newObj = new testdataCombinations(data);
            } else if (className == "globalKeys") {
                newObj = new globalKeys(data);
            } else if (className == "testdataKeys") {
                newObj = new testdataKeys(data);
            } else {
                alert("You cannot add another block.");
            }

            if(newObj) {
                $content = newObj.addAnother($content);
                var $leftColumn = $currentPage.find('.cli-data-left-column');
                var $leftData = newObj.htmlLeftContent;
                $leftData.hide();
                $leftColumn.html($leftData.fadeIn(500));
                $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", dataObj.length - 1);
            }
        },
    },

    rightColumn: {

        pinTable: function(){
            var $elem = $(this);
            var pinned = $elem.attr('pinned');
            var $currentPage = katana.$activeTab;
            var $rightColumn = $elem.closest('.cli-data-right-column');
            var $fullWidth = $rightColumn.find('.cli-data-full-width');
            var $rightTopBar = $elem.closest('.cli-data-right-column-topbar');

            if(pinned == "false"){
                $rightTopBar.find('i').addClass('fa-rotate-270 blue');
                $rightTopBar.find('i').attr('pinned', 'true');
                var $children = $fullWidth.children('.cli-data-right-column-topbar');
                for(var i=0; i<$children.length; i++){
                    $($children[i]).next().next().hide();
                    if($($children[i]).find('i').attr('pinned') == "false"){
                        $($children[i]).next().hide();
                        $($children[i]).hide();
                    }
                }

            } else {
                var $children = $fullWidth.children();
                for(var i=0; i<$children.length; i++){
                    $($children[i]).show();
                }
                $rightTopBar.get(0).scrollIntoView(true);
                $rightTopBar.find('i').removeClass('fa-rotate-270 blue');
                $rightTopBar.find('i').attr('pinned', 'false');
            }

        },

        makeActive: function(){
            var $currentPage = katana.$activeTab;
            $currentPage.find('[active="true"]').attr('active', 'false');
            var $elem = $(this);
            $elem.css("border-color", "1px solid red");
            var objectIndex = $elem.index();
            var $parentLi = $elem.closest('li');
            var fieldIndex = $parentLi.index();
            var $contentParent = $elem.closest('.cli-data-right-content');
            var $headerParent = $contentParent.prev();
            var dataObj = $headerParent.data().dataObject;
            var actualObj = dataObj[objectIndex];
            var $leftColumn = $currentPage.find('.cli-data-left-column');
            var $leftData = actualObj.htmlLeftContent;
            $leftData.hide();
            $leftColumn.html($leftData.fadeIn(500));
            $($leftColumn.find('#left-content').children().get(fieldIndex)).find('.cli-data-left-content-value-input').focus();
            $leftColumn.find('.cli-data-left-column-topbar').attr("objectIndex", objectIndex);
            $headerParent.attr('active', 'true');
            setTimeout(function(){$elem.css("border-color", "none");}, 3000);
        }

    },

}