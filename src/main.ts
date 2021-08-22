var cc = DataStudioApp.createCommunityConnector();

// https://developers.google.com/datastudio/connector/reference#isadminuser
function isAdminUser() {
    return false;
}

// https://developers.google.com/datastudio/connector/reference#getconfig
function getConfig() {
    var config = cc.getConfig();

    config
        .newTextInput()
        .setId("token")
        .setName("GraphQL Token")

    return config.build();
}

function getFields() {
    var fields = cc.getFields();
    var types = cc.FieldType;

    const myFields = [
        {id: "createdAt", name: "createdAt", type: cc.FieldType.YEAR_MONTH_DAY_SECOND, date: true},
        {id: "date", name: "date", type: cc.FieldType.YEAR_MONTH_DAY_SECOND, date: true},
        {id: "guy", name: "guy", type: cc.FieldType.TEXT},
        {id: "type", name: "type", type: cc.FieldType.TEXT},
        {id: "updatedAt", name: "updatedAt", type: cc.FieldType.YEAR_MONTH_DAY_SECOND, date: true},
        {id: "value", name: "value", type: cc.FieldType.TEXT},
    ];

    fields
        .newDimension()
        .setId('id')
        .setName('Id')
        .setType(types.TEXT);

    for (let i = 0; i < myFields.length; i++) {
        try {
            const currentField = myFields[i];
            if (currentField.date) {
                fields
                    .newDimension()
                    .setId(currentField.id)
                    .setName(currentField.name)
                    .setType(currentField.type)
                    .setGroup("DATETIME");
            } else {
                fields
                    .newDimension()
                    .setId(currentField.id)
                    .setName(currentField.name)
                    .setType(currentField.type);
            }
        } catch (e) {
            console.log("Error on newDimension of ", myFields[i].id);
            console.log(e.message);
        }
    }

    return fields;
}

// https://developers.google.com/datastudio/connector/reference#getschema
function getSchema() {
    return {schema: getFields().build()};
}

type Item = {
    createdAt: string,
    date: string,
    guy: string,
    id: string,
    type: string,
    updatedAt: string,
    value: number,
}

type ApiContent = {
    data: {
        listRecords: {
            nextToken: string,
            items: Array<Item>
        }
    }
};

const makeRequest = (token: string | null, apiToken: string): ApiContent => {
    try {
        const url = "https://g4aluhoxw5gvlitfdprmuqfwfa.appsync-api.us-east-1.amazonaws.com/graphql";
        const payload = {
            "query": `query MyQuery { listRecords${token ? `(nextToken: "${token}")` : ``} { nextToken items { createdAt date guy id type updatedAt value } } }`,
            "variables": null,
            "operationName": "MyQuery"
        }
        const response = UrlFetchApp.fetch(url, {
            headers: {
                "x-api-key": apiToken
            },
            method: "post",
            payload: JSON.stringify(payload),
            contentType: "application/json",
        });
        return JSON.parse(response.getContentText()) as ApiContent;
    } catch (e) {
        console.log("Error while making Get request");
        console.log(e.message);
        throw e;
    }
};

const getAllValues = (token: string): Array<Item> => {
    let hasMore = true;
    let results = [];
    let tokenToSend = null;

    while (hasMore) {
        try {
            const content = makeRequest(tokenToSend, token);
            tokenToSend = content.data.listRecords.nextToken;
            hasMore = !!tokenToSend;
            results = [
                ...results,
                ...(content.data.listRecords.items as Array<Item>),
            ]
        } catch (e) {
            console.log("Error while token is", tokenToSend);
            console.log(e.message);
            throw e
        }
    }

    return results;
}

const convertDateTime = (input: string): string => input
        .slice(0, 10)
        .split("-")
        .join("")
    + input
        .slice(11, 19)
        .split(":")
        .join("");

// https://developers.google.com/datastudio/connector/reference#getdata
function getData(request) {
    const {token} = request.configParams;
    var requestedFields = getFields().forIds(
        request.fields.map(function (field) {
            return field.name;
        })
    );

    const allLines = getAllValues(token);

    var rows = [];
    for (var i = 0; i < allLines.length; i++) {
        var row = [];
        requestedFields.asArray().forEach(function (field) {
            const currentLine = allLines[i];
            switch (field.getId()) {
                case 'id':
                    return row.push(currentLine["id"]);
                case "createdAt":
                    return row.push(convertDateTime(currentLine["createdAt"]))
                case "date":
                    return row.push(convertDateTime(currentLine["date"]))
                case "guy":
                    return row.push(`${currentLine["guy"]}`);
                case "type":
                    return row.push(`${currentLine["type"]}`);
                case "updatedAt":
                    return row.push(convertDateTime(currentLine["updatedAt"]))
                case "value":
                    return row.push(`${currentLine["value"]}`);
                default:
                    return row.push('');
            }
        });
        rows.push({values: row});
    }

    return {
        schema: requestedFields.build(),
        rows: rows,
    };
}
