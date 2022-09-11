import Os from "./Os.js";
import HttpMsgHandler from "../io/http/HttpMsgHandler.js";
import http from "node:http";
import express from 'express';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import {uuid} from "../F.js";

export const cmdList = {
    'webserver': async (cliArgs, {logger, appDir, mongoManager, x}) => {

    },
}