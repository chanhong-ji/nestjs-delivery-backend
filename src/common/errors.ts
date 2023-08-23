import { Injectable } from '@nestjs/common';
import { CoreOutput } from './dtos/output.dto';
import { InputType } from '@nestjs/graphql';

@InputType()
@Injectable()
export class ErrorOutputs {
    readonly DB_ERROR = 'DB Error';
    readonly RESOURCE_NOT_FOUND = 'Not Found';
    readonly VERIFICATION_FAIL = 'Verification Fail';
    readonly NOT_AUTHORIZED = 'Not Authorized';
    readonly WRONG_ACCESS = 'Wrong Access';
    readonly EMAIL_TAKEN = 'Email Already Taken';
    readonly PASSWORD_WRONG = 'Password Wrong';
    readonly CATEGORY_EXIST = 'Category Already Exists';

    dbErrorOutput = this.createErrorOutput(this.DB_ERROR);

    notFoundErrorOutput = this.createErrorOutput(this.RESOURCE_NOT_FOUND);

    mailVerificationErrorOutput = this.createErrorOutput(
        this.VERIFICATION_FAIL,
    );

    notAuthorizedError = this.createErrorOutput(this.NOT_AUTHORIZED);

    wrongAccessError = this.createErrorOutput(this.WRONG_ACCESS);

    emailAlreadyTakenError = this.createErrorOutput(this.EMAIL_TAKEN);

    passwordWrongError = this.createErrorOutput(this.PASSWORD_WRONG);

    categoryExistError = this.createErrorOutput(this.CATEGORY_EXIST);

    private createErrorOutput(errorMessage: string): CoreOutput {
        return { ok: false, error: errorMessage };
    }
}
