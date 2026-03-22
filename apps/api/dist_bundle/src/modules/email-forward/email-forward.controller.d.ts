import { RecieveEmailDto } from './dto/recieve-email.dto';
import { EmailForwardService } from './email-forward.service';
export declare class EmailForwardController {
    private readonly emailForwardService;
    constructor(emailForwardService: EmailForwardService);
    recieveEmail(recieveEmailDto: RecieveEmailDto): void;
    getEmailSubject(): Promise<{
        subjects: string[];
    } | undefined>;
}
