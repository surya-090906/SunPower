"""The workflow engine. Every stage change in the app goes through one of these functions.

T0  receive_stock          T9   scan_serial / pack_item     T14 open_ticket
T1  submit_enquiry         T10  dispatch_order              T15 resolve_ticket
T2  record_qualification   T11  confirm_delivery            T16 confirm_ticket / close_ticket
T3  submit_survey          T12  complete_install
T4  review_survey          T13  maybe_complete
T5  build_quote            T6   send_quote     T7  accept_quote     T8  record_payment / verify_payment
"""
from .accounts import add_cost, claim_account, complete_task, invite_customer, maybe_complete  # noqa: F401
from .common import RuleError, require_role  # noqa: F401
from .field import CHECKS, complete_install, customer_slot, finish_hardware_sale, submit_survey  # noqa: F401
from .payments import PaymentResult, record_payment, schedule_install, verify_payment  # noqa: F401
from .quotes import (accept_quote, ask_question, build_quote, quote_add_line, quote_remove_line, quote_reset,  # noqa: F401
                     quote_set_discount, quote_update_lines, send_quote)
from .sales import mark_lost, record_qualification, request_survey, review_survey, submit_enquiry  # noqa: F401
from .service import close_ticket, confirm_ticket, open_ticket, resolve_ticket, set_exclusion  # noqa: F401
from .stock import (confirm_delivery, dispatch_order, dispatch_progress, pack_item, receive_stock,  # noqa: F401
                    scan_many, scan_serial)
