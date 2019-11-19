import { asyncScheduler, of, Observable } from 'rxjs';
import { observeOn } from 'rxjs/operators';

import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Put,
    Param,
    Query,
    Req,
    Res,
    Session,
    ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';

import { TransformQueryPipe } from './lib/transform-query.pipe';
import {
    CreateGroupRequest,
    CreateGroupResponse,
    GetGroupParameters,
    GetGroupResponse,
    GetGroupsResponse,
    GetGroupsParameters,
    ToDoGroup,
    UpdateGroupParameters,
    UpdateGroupRequest,
    UpdateGroupResponse,
    RewriteGroupParameters,
    RewriteGroupRequest,
    RewriteGroupResponse,
} from './schema/typings';
import { TodoStorageService } from './todoStorageService';

@Controller('group')
export class AppController {
    public session;

    constructor(private readonly appService: TodoStorageService) {}

    @Get()
    getGroups(
        @Query(TransformQueryPipe) query: GetGroupsParameters,
        @Session() session,
    ): GetGroupsResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .getGroups(query);
    }

    @Get(':groupId')
    getGroup(
        @Param(TransformQueryPipe) params: GetGroupParameters,
        @Session() session,
    ): GetGroupResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .getGroup(params.groupId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    postGroup(
        @Body() body: CreateGroupRequest,
        @Session() session,
    ): CreateGroupResponse<HttpStatus.CREATED> {
        return this.appService
            .setSession(session)
            .createGroup(body);
    }

    @Put(':groupId')
    rewriteGroup(
        @Param(TransformQueryPipe) params: RewriteGroupParameters,
        @Body() body: RewriteGroupRequest,
        @Session() session,
    ): RewriteGroupResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .rewriteGroup(params.groupId, body);
    }

    @Patch(':groupId')
    patchGroup(
        @Param(TransformQueryPipe) params: UpdateGroupParameters,
        @Body() body: UpdateGroupRequest,
        @Session() session,
    ): UpdateGroupResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .patchGroup(params.groupId, body);
    }
}
