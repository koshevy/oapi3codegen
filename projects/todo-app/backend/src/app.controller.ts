import {
    BadRequestException,
    Body,
    Controller,
    Delete,
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
    ParseIntPipe
} from '@nestjs/common';
import { Response } from 'express';

import { ParseQueryPipe } from './lib/parse-query.pipe';
import {
    CreateGroupRequest,
    CreateGroupResponse,
    CreateGroupItemParameters,
    CreateGroupItemRequest,
    CreateGroupItemResponse,
    DeleteGroupParameters,
    DeleteGroupResponse,
    GetGroupParameters,
    GetGroupResponse,
    GetGroupsResponse,
    GetGroupsParameters,
    GetGroupItemsParameters,
    GetGroupItemsResponse,
    ToDoGroup,
    UpdateGroupParameters,
    UpdateGroupRequest,
    UpdateGroupResponse,
    RewriteGroupParameters,
    RewriteGroupRequest,
    RewriteGroupResponse
} from './schema/typings';

import { TodoStorageService } from './todo-storage.service';

@Controller('group')
export class AppController {
    public session;

    constructor(private readonly appService: TodoStorageService) {}

    @Get()
    getGroups(
        @Query(ParseQueryPipe) query: GetGroupsParameters,
        @Session() session
    ): GetGroupsResponse<HttpStatus.OK> {
        return this.appService
          .setSession(session)
          .getGroups(query);
    }

    @Get(':groupId')
    getGroup(
        @Param(ParseQueryPipe) params: GetGroupParameters,
        @Session() session
    ): GetGroupResponse<HttpStatus.OK> {
        return this.appService
          .setSession(session)
          .getGroupByUid(params.groupId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    postGroup(
        @Body() body: CreateGroupRequest,
        @Session() session
    ): CreateGroupResponse<HttpStatus.CREATED> {
        return this.appService
          .setSession(session)
          .createGroup(body);
    }

    @Put(':groupId')
    rewriteGroup(
        @Param(ParseQueryPipe) params: RewriteGroupParameters,
        @Body() body: RewriteGroupRequest,
        @Session() session
    ): RewriteGroupResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .rewriteGroup(params.groupId, body);
    }

    @Patch(':groupId')
    patchGroup(
        @Param(ParseQueryPipe) params: UpdateGroupParameters,
        @Body() body: UpdateGroupRequest,
        @Session() session
    ): UpdateGroupResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .patchGroup(params.groupId, body);
    }

    @Delete(':groupId')
    @HttpCode(HttpStatus.ACCEPTED)
    deleteGroup(
        @Param(ParseQueryPipe) params: UpdateGroupParameters,
        @Body() body: UpdateGroupRequest,
        @Session() session
    ): DeleteGroupResponse<HttpStatus.ACCEPTED> {
        this.appService
            .setSession(session)
            .deleteGroup(params.groupId);

        return null;
    }

    /**
     * todo support filters (isComplete)
     */
    @Get(':groupId/item')
    getTasks(
        @Param(ParseQueryPipe) params: GetGroupItemsParameters,
        @Session() session
    ): GetGroupItemsResponse<HttpStatus.OK> {
        return this.appService
            .setSession(session)
            .getTasksOfGroup(params.groupId);
    }

    @Post(':groupId/item')
    createTask(
        @Param(ParseQueryPipe) params: CreateGroupItemParameters,
        @Body() body: CreateGroupItemRequest,
        @Session() session
    ): CreateGroupItemResponse<HttpStatus.CREATED> {
        return this.appService
            .setSession(session)
            .createTaskOfGroup(params.groupId, body);
    }
}
