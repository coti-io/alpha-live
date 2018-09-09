function transactionsController() {
    const NUMBER_OF_TRANSACTIONS_TO_CUT_FROM = 250;
    const MAX_HEIGHT_ALOWED = 3;
    const updateViewScheduledInSeconds = 3;
    const GET_FULL_GRAPH_URL_ACTION = '/fullgraph';
    const FULL_NODE_WEBSOCKET_ACTION = '/websocket';
    const FULL_NODE_WEBSOCKET_SUBSCRIPTION_ACTION = '/topic/nodes';
    const refreshDataFlag = true;

    let onPause = false;
    let onUpdate = false;
    let onRefresh = false;
    let nodesFromWS = [];
    let onHttpGet = false;
    let socketConnectionOn = false;

    const httpGetFullGraph = function (url) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = function () {
                if (req.status == 200) {
                    resolve(req.response);
                } else {
                    reject(Error(req.statusText));
                }
            };
            req.onerror = () => reject(Error("Network Error"));
            req.send();
        });
    }

    transactionsController.pause = () => onPause = !onPause;

    transactionsController.connect = async function () {
        if(socketConnectionOn){
            stompClient.disconnect();
            graphDataNodes.clear();
            allDataNodes.clear() ;
            nodesFromWS = [] ;
            graph3dHandler.removeAll();
            sumOfNodesHandler.resetViewCounters();
            graph3dHandler.updateGraph();
            socketConnectionOn = false;
        }
        onHttpGet = true;
        let serveraddress = document.getElementById("selectedFullnode").value;
        await openWebSocketConnection(serveraddress);
        subscribeToWebSocket(serveraddress);
        await getFullNodeWithHttp(serveraddress);
    };

    setInterval(readFromWSNodesList, updateViewScheduledInSeconds * 1000);

    function readFromWSNodesList() {
        let arrayLength = nodesFromWS.length;
        if (!onPause && !onUpdate && !onRefresh && !onHttpGet) {
            let nodesFromWsCopy = nodesFromWS.splice(0, arrayLength);
            while (nodesFromWsCopy[0] != null) {
                let node = nodesFromWsCopy.shift(); // remove head 
                if (!deletedNodes.has(node.id)) {
                    addNewNodeFromQueue(node);
                    if (refreshDataFlag && (graphDataNodes.size >= NUMBER_OF_TRANSACTIONS_TO_CUT_FROM)) {
                        refreshData();
                    }
                }
            }
        }
    };

    async function getFullNodeWithHttp(serveraddress) {
        console.log('connecting to ' + serveraddress + ' for http GET - fullGraph request'); 
        let nodes = [];
        try {
            httpGetFullGraph(serveraddress + GET_FULL_GRAPH_URL_ACTION)
                .then(function (res) {
                    if (res) {
                        nodes = JSON.parse(res).nodes;
                        //sort by attachment time ascending
                        nodes.sort((a, b) => a.attachmentTime - b.attachmentTime);
                        for (let i = 0; i < nodes.length; i++) {
                            node = nodes[i];
                            if (allDataNodes.has(node.id) && !graphDataNodes.has(node.id)) {
                                continue;
                            }
                            // updateTrxCountersForWebSocket(node);
                            handleNodeFromHttp(node);
                            if (refreshDataFlag && (graphDataNodes.size >= NUMBER_OF_TRANSACTIONS_TO_CUT_FROM)) {
                                refreshData();
                            }
                        }
                        onHttpGet = false;
                    }
                });
        } catch (ex) {
            console.error(ex);
        }
    }


    const subscribeToWebSocket = function () {
        stompClient.subscribe(FULL_NODE_WEBSOCKET_SUBSCRIPTION_ACTION, function (nodeDataMessage) {
            node = JSON.parse(nodeDataMessage.body);
            updateTrxCountersForWebSocket(node);
            let newNode = createGraphNode(node);
            nodesFromWS.push(newNode);
        });
    }

    async function openWebSocketConnection(serveraddress) {
        const socket = new SockJS(serveraddress + FULL_NODE_WEBSOCKET_ACTION);
        stompClient = Stomp.over(socket);
        const connectPromise = new Promise((resolve, reject) => {
            stompClient.connect({}, function (frame) {
                console.log('Connected: ' + frame + ' for websocket - nodes update');
                socketConnectionOn = true
                resolve();
            });
        });
        await connectPromise;
    }

    function updateTrxCountersForWebSocket(node) {
        let nodeFromAllData = allDataNodes.get(node.id);
        if (nodeFromAllData == null) {
            sumOfNodesHandler.updateTransactionsStatusInHtml(node.status, null);
            allDataNodes.set(node.id, node);
        } else {
            sumOfNodesHandler.updateTransactionsStatusInHtml(node.status, nodeFromAllData.status);
            nodeFromAllData.status = node.status;
        }
    }

    function updateTrxCountersForHttp(node) {
        allDataNodes.set(node.id, node);
        sumOfNodesHandler.updateTransactionsStatusInHtml(node.status, null);
    }


    function refreshData() {
        graphDataNodes.forEach(moveHighNodesToDeletedNodes);
        if (onUpdate == true) {
            graphDataNodes.forEach(setHeightToSourcesInMap);
            refreshGraphicalViews();
        }
        onUpdate = false;
    }

    function moveHighNodesToDeletedNodes(value, key, map) {
        if (value.height > MAX_HEIGHT_ALOWED) {
            onUpdate = true;
            deletedNodes.set(key, value);
            map.delete(key);

        }
    }

    function setHeightToSourcesInMap(value, key, map) {
        if (value.status == 0) {
            setHeights(value);
        }
    }

    function refreshGraphicalViews() {
        onRefresh = true;
        graph3dHandler.removeAll();
        graphDataNodes.forEach((value, key, map) => graph3dHandler.addNewNode(value));
        graph3dHandler.deleteFromDagData();
        graph3dHandler.updateGraph();
        onRefresh = false;
    }

    function addNewNodeFromQueue(node) {
        sumOfNodesHandler.updateRealCounters();
        let nodeFromDagData = graphDataNodes.get(node.id);
        if (nodeFromDagData != null) {
            nodeFromDagData.status = node.status;
            graph3dHandler.addNode(nodeFromDagData);
        } else {
            setHeights(node);
            graphDataNodes.set(node.id, node);
            graph3dHandler.addNode(node);
        }
        /* for the chart section in the html
       if (node.status == TCC_CONFIRMED) {
           chartHandler.addConfirmedTransactionToChart(node.trustScore, node.tccDuration);
       }
       */
    }

    function handleNodeFromHttp(node) {
        let newNode = createGraphNode(node);
        if (graphDataNodes.has(newNode.id)) {
            return;
        }
        setHeights(newNode);
        graphDataNodes.set(newNode.id, newNode);
        updateTrxCountersForHttp(node);
        graph3dHandler.addNode(newNode);
        /* for the chart section in the html
        if (node.status == TCC_CONFIRMED) {
            chartHandler.addConfirmedTransactionToChart(node.trustScore, node.tccDuration);
        }
        */
    }

    function createGraphNode(node) {
        let newNode = {
            id: node.id,
            trustScore: node.trustScore,
            status: node.status,
            attachmentTime: node.attachmentTime,
            time: new Date(node.attachmentTime).getTime(),
            leftParent: node.leftParent,
            rightParent: node.rightParent,
            tccDuration: node.tccDuration,
            genesis: node.genesis,
            height: node.height
        };
        return newNode;
    }


    function setHeights(root) {
        if (root == null || root == undefined) {
            return;
        }
        if (root.height == undefined)
            root.height = 1;
        let currentHeight = root.height + 1;
        let leftParentNode = graphDataNodes.get(root.leftParent);
        if (leftParentNode != undefined) {
            if (leftParentNode.hasOwnProperty('height') || isNaN(leftParentNode.height) || currentHeight > leftParentNode.height) {
                leftParentNode.height = currentHeight;
            }
            setHeights(leftParentNode);
        }
        let rightParentNode = graphDataNodes.get(root.rightParent);
        if (rightParentNode != undefined) {
            if (rightParentNode.hasOwnProperty('height') || isNaN(rightParentNode.height) || currentHeight > rightParentNode.height) {
                rightParentNode.height = currentHeight;
            }
            setHeights(rightParentNode);
        }
    };

}
transactionsController();