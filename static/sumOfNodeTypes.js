function sumOfNodesHandler() {

    let transactionsStatusCounterArray = [
        0,
        0,
        0,
        0
    ];

    function getElementByStatusType(statusType) {
        switch (statusType) {
            case SOURCE: //0
                return document.getElementById("sources-value");
            case VALIDATE: //1
                return document.getElementById("attached-value");
            case TCC_CONFIRMED: //2
                return document.getElementById("tcc-confirmed-value");
            case TRANSACTIONS_ON_VIEW:
                return document.getElementById("transactions-onview-value");
            case TRANSACTIONS_COUNT:
                return document.getElementById("transactions-count-value");
            default:{
                console.error("BAD status type! :"+statusType );
                return ;
            }
        }
    }
    
    sumOfNodesHandler.resetViewCounters = () => {
        transactionsStatusCounterArray = [0,0,0,0];
        document.getElementById("sources-value").innerHTML = 0;
        document.getElementById("attached-value").innerHTML = 0;
        document.getElementById("tcc-confirmed-value").innerHTML = 0;
        document.getElementById("transactions-onview-value").innerHTML = 0;
        document.getElementById("transactions-count-value").innerHTML = 0;
    }

    sumOfNodesHandler.updateTransactionsStatusInHtml = function (newStatus, oldStatus) {
        sumOfNodesHandler.updateRealCounters();
        if (newStatus == oldStatus) {
            return;
        }
        let newStatusElement = getElementByStatusType(newStatus);
        newStatusElement.innerText = ++transactionsStatusCounterArray[newStatus];
        if (oldStatus != null) {
            let oldStatusElement = getElementByStatusType(oldStatus);
            oldStatusElement.innerText = --transactionsStatusCounterArray[oldStatus];
        }
    }

    sumOfNodesHandler.updateRealCounters = function () {
        getElementByStatusType(TRANSACTIONS_COUNT).innerHTML = allDataNodes.size;
        getElementByStatusType(TRANSACTIONS_ON_VIEW).innerHTML = graphDataNodes.size;
    }

}

sumOfNodesHandler();