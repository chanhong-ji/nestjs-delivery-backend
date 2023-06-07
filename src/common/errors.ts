import { Injectable } from '@nestjs/common';
import { CoreOutput } from './dtos/output.dto';

@Injectable()
export class ErrorOutputs {
    private readonly DB_ERROR = 'DB Error';
    private readonly RESOURCE_NOT_FOUND = 'Not Found';
    private readonly VERIFICATION_FAIL = 'Verification fail';
    private readonly NOT_AUTHORIZED = 'Not Authorized';
    private readonly WRONG_ACCESS = 'Wrong Access';
    private readonly EMAIL_TAKEN = 'Email already taken';
    private readonly PASSWORD_WRONG = 'Password wrong';
    private readonly CATEGORY_EXIST = 'Category already exists';

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
