import Id from "../nodes/id/Id.js";
import Op from "../nodes/Op.js";
import Literal from "../nodes/literal/Literal.js";
import NewLine from "../nodes/NewLine.js";
import For from "../nodes/conditionAndBody/loop/For.js";
import If from "../nodes/conditionAndBody/if/If.js";
import ForConditionPart from "../nodes/conditionAndBody/loop/ForConditionPart.js";
import Callable from "../nodes/conditionAndBody/call/callable/Callable.js";
import CallableConditionPart from "../nodes/conditionAndBody/call/callable/CallableConditionPart.js";
import ArrayChunk from "../nodes/literal/array/ArrayChunk.js";
import ArrayItem from "../nodes/literal/array/ArrayItem.js";
import ObjectItem from "../nodes/literal/object/ObjectItem.js";
import ObjectNode from "../nodes/literal/object/ObjectNode.js";
import Keyword from "../nodes/Keyword.js";
import SubId from "../nodes/id/SubId.js";
import Call from "../nodes/conditionAndBody/call/call/Call.js";
import Import from "../nodes/module/import/Import.js";
import CallConditionPart from "../nodes/conditionAndBody/call/call/CallConditionPart.js";
import CallableBody from "../nodes/conditionAndBody/call/callable/CallableBody.js";
import ShiftHelper from "./ShiftHelper.js";

export default class AstSerializer {

    serialize(chunk) { return chunk.serialize(); }

    deserialize(moduleNode, chunksData) {

        const deserializeImportNode = (data) => {
            const _import = new Import('', {id: data.id});
            if (data.name) _import.insertInImportName(new Id(data.name));
            if (data.path) _import.insertInImportPath(new Id(data.path));
            return _import;
        }

        const deserializeIfChunk = (d) => {
            const if_ = new If('', {id: d.id});
            buildAST(if_.getCondition(), d.condition);
            buildAST(if_.getBody(), d.body);

            return if_;
        }

        const deserializeForChunk = (chunkData) => {
            const forChunk = new For;

            const condition = chunkData.condition;
            const body = chunkData.body;

            if (condition && condition.length > 0) {
                for (let i = 0; i < condition.length; i++) {

                    const forConditionPart = new ForConditionPart;
                    forChunk.insertInCondition(forConditionPart);
                    buildAST(forConditionPart, condition[i].internal);
                }
            }
            if (body && body.length > 0) buildAST(forChunk.getBody(), body);

            return forChunk;
        }
        const deserializeCallable = (data, shiftHelper) => {

            const callable = new Callable('', {id: data.id, conditionId: data.conditionId, bodyId: data.bodyId});
            if (data.async) callable.switchToAsync();

            const condition = data.condition;
            const body = data.body;

            if (condition && condition.length > 0) {
                for (let i = 0; i < condition.length; i++) {
                    if (!condition[i].internal) {
                        throw new Error('invalid data ' + JSON.stringify(condition[i]))
                    }

                    const conditionPart = new CallableConditionPart('', {id: condition[i].id});
                    buildAST(conditionPart, condition[i].internal);
                    callable.insertInCondition(conditionPart);
                }
            }
            if (body && body.length > 0) buildAST(callable.getBody(), body);

            return callable;
        }
        const deserializeCall = (data) => {

            const call = new Call('', {id: data.id, conditionId: data.conditionId});
            const condition = data.condition;

            for (let i = 0; i < condition.length; i++) {

                if (!condition[i].internal) throw new Error('invalid data ' + JSON.stringify(condition[i]))

                const conditionPart = new CallConditionPart('', {id: condition[i].id});
                call.insertInCondition(conditionPart);
                buildAST(conditionPart, condition[i].internal);
            }

            return call;
        }
        const deserializeArrayChunk = (data) => {

            const array = new ArrayChunk;
            const body = data.body;

            if (!body) throw new Error('invalid ArrayChunk data ' + JSON.stringify(data));

            for (let i = 0; i < body.length; i++) {
                const arrayItem = new ArrayItem('', {id: body[i].id});
                buildAST(arrayItem, body[i].itemParts);

                array.insert(arrayItem);
            }

            return array;
        }
        const deserializeObjectChunk = (data) => {

            const object = new ObjectNode('', {id: data.id});
            const body = data.body;

            if (!object) {
                throw new Error('invalid ObjectNode data ' + JSON.stringify(data));
            }
            for (let i = 0; i < body.length; i++) {
                const objectItem = new ObjectItem('', {id: body[i].id});
                buildAST(objectItem.getKey(), body[i].k.itemParts);
                buildAST(objectItem.getValue(), body[i].v.itemParts);
                object.insert(objectItem);
            }

            return object;
        }
        const deserializeSubId = (subIdData) => {

            if (!subIdData) throw new Error('invalid subIdData ' + JSON.stringify(subIdData));

            const subId = new SubId('', {id: subIdData.id});
            buildAST(subId, subIdData.container);
            return subId;
        }

        const buildAST = (astNode, data, shiftH) => {

            let lastInsertedNode = null;

            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                let nodeForIns;

                if (d.t === 'Id') {
                    const nameChunk = new Id(d.name, {id: d.id});
                    if (d.mode) nameChunk.enableMode(d.mode);
                    nodeForIns = nameChunk;
                    if (shiftH) shiftH.handleShift(nodeForIns);

                } else if (d.t === 'SubId') {
                    nodeForIns = deserializeSubId(d);
                } else if (d.t === 'Op') {
                    nodeForIns = new Op(d.op, {id: d.id});
                } else if (d.t === 'Literal') {
                    nodeForIns = new Literal(d.txt, d.type, {id: d.id});
                } else if (d.t === 'NewLine') {
                    const newLine = new NewLine('', {id: d.id});
                    if (lastInsertedNode instanceof NewLine) {
                        newLine.addVerticalShift();
                    }
                    nodeForIns = newLine;
                }
                else if (d.t === 'If') nodeForIns = deserializeIfChunk(d);
                else if (d.t === 'For') nodeForIns = deserializeForChunk(d);
                else if (d.t === 'Call') nodeForIns = deserializeCall(d);
                else if (d.t === 'Callable') nodeForIns = deserializeCallable(d, shiftH);
                else if (d.t === 'CallableConditionPart') {

                    const callableConditionPart = new CallableConditionPart;
                    buildAST(callableConditionPart, d.internal);
                    nodeForIns = callableConditionPart;
                }
                else if (d.t === 'ArrayChunk') nodeForIns = deserializeArrayChunk(d);
                else if (d.t === 'ObjectNode') nodeForIns = deserializeObjectChunk(d);
                else if (d.t === 'Keyword') nodeForIns = new Keyword(d.keyword);
                else if (d.t === 'Import') nodeForIns = deserializeImportNode(d);
                else {
                    console.error(`No handler for chunk [${d.t}].`);
                    console.log(astNode, d);
                    continue;
                }

                if (!nodeForIns) continue;

                const lastNode = astNode.getLastChunk();
                if (nodeForIns instanceof Op && nodeForIns.getTxt() === '!' && !(lastNode instanceof Op)) {
                    nodeForIns.hideSpaces();
                }

                astNode.insert(nodeForIns);
                lastInsertedNode = nodeForIns;
            }
        }

        if (chunksData.imports) buildAST(moduleNode.getImports(), chunksData.imports);
        if (chunksData.callableCondition) buildAST(moduleNode.getCallableCondition(), chunksData.callableCondition);
        if (chunksData.body) buildAST(moduleNode.getBody(), chunksData.body, new ShiftHelper(0));
    }
}