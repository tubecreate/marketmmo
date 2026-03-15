'use client';
import React from 'react';
import { Box, Typography, Step, Stepper, StepLabel, StepConnector, stepConnectorClasses, styled } from '@mui/material';
import Check from '@mui/icons-material/Check';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#16a34a',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#16a34a',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#dee2e6',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  active?: boolean;
  completed?: boolean;
}>(({ theme, active, completed }) => ({
  backgroundColor: '#dee2e6',
  zIndex: 1,
  color: '#fff',
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 4px 10px 0 rgba(0,0,0,.15)',
  ...(active && {
    backgroundColor: '#16a34a',
    boxShadow: '0 4px 10px 0 rgba(22, 163, 74, .25)',
  }),
  ...(completed && {
    backgroundColor: '#16a34a',
  }),
}));

function ColorlibStepIcon(props: any) {
  const { active, completed, className } = props;

  return (
    <ColorlibStepIconRoot active={active} completed={completed} className={className}>
      {completed ? <Check sx={{ fontSize: 20 }} /> : <Typography sx={{ fontWeight: 800 }}>{props.icon}</Typography>}
    </ColorlibStepIconRoot>
  );
}

const steps = ['Đặt hàng', 'Đang làm', 'Hoàn tất'];

export default function OrderProgressStepper({ status }: { status: string }) {
  let activeStep = 0;
  if (status === 'IN_PROGRESS') activeStep = 1;
  if (['DELIVERED', 'COMPLETED', 'HOLDING'].includes(status)) activeStep = 2;

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel 
              StepIconComponent={ColorlibStepIcon}
              sx={{ 
                '& .MuiStepLabel-label': { 
                  fontWeight: 800, 
                  fontSize: '0.85rem',
                  color: '#64748b',
                  mt: 1
                },
                '& .MuiStepLabel-label.Mui-active': { color: '#16a34a' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#16a34a' }
              }}
            >
              {label.toUpperCase()}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
