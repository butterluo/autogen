import { MessageProfile, MessageHistoryWidget } from './widgets.js';
import { FilterWidget } from './widgets.js';
import { BarChartWidget } from './barchart.js';
import { TimelineWidget } from './timelines.js';
import { DirectedGraphWidget } from './graph.js';



function renderOrUpdate(parentNode, widget) {
    /*
    If the node already exists, replace it with the new widget
    If the node does not exist, append it to the body
    */
    const existingNode = document.getElementById(widget.id);
    if (existingNode) {
        existingNode.replaceWith(widget.compose());
    } else {
        parentNode.appendChild(widget.compose());
    }
}

function renderFilters(data) {
    // Extract names of all the tags from the data
    const tags = data.reduce((acc, message) => {
        message.message.tags.forEach(tag => {
            if (!acc.includes(tag)) {
                acc.push(tag);
            }
        });
        return acc;
    }, []);

    const tagFilter = new FilterWidget({
        id: "tag-filter-widget",
        filterArray: tags
    });

    renderOrUpdate(document.body, tagFilter);

    return [tagFilter];
}


function updateAllWidgets(data) {
    const messageHistoryWidget = new MessageHistoryWidget({
        id: "message-history-widget",
        messageProfileArray: data
    });

    renderOrUpdate(document.body, messageHistoryWidget);

    // get mapping from states to counts
    const stateCounts = data.reduce((acc, profile) => {
        profile.states.forEach(state => {
            const stateName = state.name;
            if (!acc[stateName]) {
                acc[stateName] = 0;
            }
            acc[stateName]++;
        });
        return acc;
    }, {});

    const barchart = new BarChartWidget({
        id: "bar-chart-widget",
        data: stateCounts
    });

    renderOrUpdate(document.body, barchart);

    const timelineWidget = new TimelineWidget({
        id: "timeline-widget",
        profileArray: data
    });

    renderOrUpdate(document.body, timelineWidget);

    const directedGraphWidget = new DirectedGraphWidget({
        id: "directed-graph-widget",
        profileArray: data
    });

    // renderOrUpdate(document.body, directedGraphWidget);
}

function getFilteredData(labels, data) {
    // Filter the data based on the labels
    // If labels is empty, return the original data
    if (labels.length === 0) {
        return data;
    }

    // Filter the data based on the labels
    // Include if any of the labels are in the tags
    return data.filter(profile => {
        const tagMatch = labels.some(label => profile.message.tags.includes(label));
        return tagMatch;
    });
}


function getFilterMask(labels, data) {
    // Create a mask of the data based on the labels
    return data.map(message => {
        const tagMatch = labels.some(label => message.tags.includes(label));
        return tagMatch;
    });
}


function renderPage(data) {
    const filters = renderFilters(data);
    updateAllWidgets(data);

    // listen for the filterChanged event
    document.addEventListener('filterChanged', (event) => {
        // get all the filters that are checked
        const checkedFilters = filters.reduce((acc, filter) => {
            return acc.concat(filter.getCheckedFilters());
        }, []);
        const filteredData = getFilteredData(checkedFilters, data);
        updateAllWidgets(filteredData);
    });
}

function parseData(data) {
    console.log(data);
    // Parse the data
    const formattedData = [];
    // loop through the data and create a new ProfiledMessage
    // object for each message

    data.forEach(row => {
        const msg = new MessageProfile({
            message: row.message,
            states: row.states
        });
        formattedData.push(msg);
    });

    console.log(formattedData);
    return formattedData;
}

(function loadData() {
    // Load data from the path
    const path = 'data.json';

    // Fetch the data from the path
    fetch(path)
        .then(response => response.json())
        .then(data => parseData(data))
        .then(data => renderPage(data));
})();
