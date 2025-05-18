import { IsString, IsNotEmpty } from 'class-validator';

export class GetReportCallCostByExtensionGroupDto {
  @IsString()
  @IsNotEmpty()
  periodFrom: string;

  @IsString()
  periodTo: string;
}
