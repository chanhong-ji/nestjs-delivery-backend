import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('uploads')
@Public()
export class UploadsController {
    constructor(private readonly configService: ConfigService) {}

    @Post('')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        AWS.config.update({
            credentials: {
                accessKeyId: this.configService.get('aws.accessKey'),
                secretAccessKey: this.configService.get('aws.secretKey'),
            },
            region: 'ap-northeast-2',
        });
        try {
            const { originalname, buffer } = file;
            const objectName = Date.now() + originalname;
            const { Location } = await new AWS.S3()
                .upload({
                    Bucket: 'nestjs-delivery-bucket',
                    Key: objectName,
                    ACL: 'public-read',
                    Body: buffer,
                })
                .promise();

            return { file: Location };
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}
