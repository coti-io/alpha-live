
function graph3dHandler() {

    const bg_color = 0xf5f5f5;
    const distance = 2000;
    const elem = document.getElementById("3d-graph");
    const window_width = $("#3d-graph").width();
    const status_color = [0xff7f0e, 0x1f77b4, 0x222222, 0x0826d1, 0x008000];
    const node_status = ["Source", "Validated", "Confirmed"];

    let newNodesForGraph = new Map();
    let newLinksForGraph = [];

    var Graph = ForceGraph3D()(elem)
        .backgroundColor(bg_color)
        .width(window_width)
        .height(window.innerHeight * 0.9)
        .enableNodeDrag(false)
        .nodeRelSize(11)
        .linkCurvature(0.25)
        .linkDirectionalArrowLength(12)
        .linkDirectionalArrowRelPos(1)

        .linkWidth(5)
        .linkColor(0x999999)
        .cameraPosition({ z: distance })

        .onNodeHover(node => {
            (document.getElementById('3d-graph')).style.cursor = 'pointer';
        })
        .nodeLabel(node => {
            let textInput = "<p style=\"color:#000020; font-size:14px; font-weight: bold; background-color:#f4f4f4\"><b>Id: " +
                node.id.toString() + "<br>Trust Score: " +
                node.trustScore.toString() +
                "<br>AttachmentTime: " +
                node.time +
                "<br>Height: " +
                node.height +
                "<br>Status: " +
                node_status[node.status] +
                "</b></p>";
            return textInput;
        })
        .nodeColor(node => node.genesis ? status_color[3] : status_color[node.status])
        .forceEngine("d3")
        .d3Force("links", null)
        .d3Force('radial', d3.forceRadial(d => chooseRadius(d.status)))
        .d3Force("center", d3.forceCenter(0, 0, distance / 2));

    function chooseRadius(status) {
        switch (status) {
            case 0:
                return 800 + (Math.random() * 400);
            case 1:
                return 500 + (Math.random() * 300);
            case 2:
                return 100 + (Math.random() * 200);
            default:
                return 1000;
        }
    }

    graph3dHandler.getGraphSize = () => Graph.graphData().nodes.length;

    const findNodeIndexById = nodeId => Graph.graphData().nodes.findIndex(item => item.id == nodeId);

    graph3dHandler.findNodeObjectById = nodeId => Graph.graphData().nodes.find(item => item.id == nodeId);

    graph3dHandler.removeAll = (emptyLinks = [], emptyNodes = []) => Graph.graphData({ nodes: emptyNodes, links: emptyLinks });

    graph3dHandler.addNode = function (newNode) {
        let nodeIndex = findNodeIndexById(newNode.id);
        if (nodeIndex >= 0) { // Update an existing node
            let graphNodes = Graph.graphData().nodes;
            graphNodes[nodeIndex].status = newNode.status;
            Graph.graphData(
                {
                    nodes: graphNodes,
                    links: Graph.graphData().links
                }
            );
        }
        else {
            graph3dHandler.addNewNode(newNode);
            graph3dHandler.updateGraph();
        }
    }

    function addParentNodeIfNotExists(newNode, parentNode) {
        let newLink = [];
        if (parentNode != undefined) {
            if (!newNodesForGraph.has(newNode.id)) {
                newNodesForGraph.set(newNode.id, newNode);
            }
            if (!newNodesForGraph.has(parentNode.id) && findNodeIndexById(parentNode.id) < 0) {
                newNodesForGraph.set(parentNode.id, parentNode);
            }
            newLink = [{ source: newNode.id, target: parentNode.id }];
        }
        return newLink;
    }


    graph3dHandler.addNewNode = function (newNode) {
        if (newNode.genesis == true) {
            newNodesForGraph.set(newNode.id, newNode);
            return;
        }
        let leftParent = graphDataNodes.get(newNode.leftParent);
        let rightParent = graphDataNodes.get(newNode.rightParent);

        let leftLinks = addParentNodeIfNotExists(newNode, leftParent);
        let rightLinks = addParentNodeIfNotExists(newNode, rightParent);

        if (leftLinks.length > 0) {
            newLinksForGraph.push(...leftLinks);
        }
        if (rightLinks.length > 0) {
            newLinksForGraph.push(...rightLinks);
        }
    };

    graph3dHandler.deleteFromDagData = () => graphDataNodes.forEach(moveFromGraphDataNodesToDeleted);

    function moveFromGraphDataNodesToDeleted(value, key, map) {
        if (!newNodesForGraph.has(key) && value.genesis != true) {
            deletedNodes.set(key, value);
            map.delete(key);
        }
    }

    graph3dHandler.updateGraph = function () {
        let newNodes = [...Graph.graphData().nodes, ...newNodesForGraph.values()];
        let newLinks = [...Graph.graphData().links, ...newLinksForGraph];
        Graph.graphData(
            {
                nodes: newNodes,
                links: newLinks
            }
        );
        newNodesForGraph.clear();
        newLinksForGraph = [];
    };
}


graph3dHandler();

