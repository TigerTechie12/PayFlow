module payflow::batch_pay {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    const EMismatchedLengths: u64 = 0;
    const EEmptyPayments: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EInvalidBatchId: u64 = 3;

    struct BatchPaymentExecuted has copy, drop {
        batch_id: vector<u8>,
        payer: address,
        total_amount: u64,
        recipient_count: u64,
        timestamp: u64,
    }

    struct PaymentSent has copy, drop {
        batch_id: vector<u8>,
        recipient: address,
        amount: u64,
        reference: vector<u8>,
    }

    public entry fun batch_payout_generic<T>(
        payment_coin: &mut Coin<T>,
        recipients: vector<address>,
        amounts: vector<u64>,
        batch_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&recipients);
        assert!(len > 0, EEmptyPayments);
        assert!(len == vector::length(&amounts), EMismatchedLengths);
        assert!(vector::length(&batch_id) > 0, EInvalidBatchId);

        let total = calculate_total(&amounts);
        assert!(coin::value(payment_coin) >= total, EInsufficientBalance);

        event::emit(BatchPaymentExecuted {
            batch_id: batch_id,
            payer: tx_context::sender(ctx),
            total_amount: total,
            recipient_count: len,
            timestamp: tx_context::epoch(ctx),
        });

        let i = 0;
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            let payment = coin::split(payment_coin, amount, ctx);

            event::emit(PaymentSent {
                batch_id: batch_id,
                recipient,
                amount,
                reference: vector::empty(),
            });

            transfer::public_transfer(payment, recipient);
            i = i + 1;
        };
    }

    public entry fun batch_payout_with_refs_generic<T>(
        payment_coin: &mut Coin<T>,
        recipients: vector<address>,
        amounts: vector<u64>,
        references: vector<vector<u8>>,
        batch_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&recipients);
        assert!(len > 0, EEmptyPayments);
        assert!(len == vector::length(&amounts), EMismatchedLengths);
        assert!(len == vector::length(&references), EMismatchedLengths);
        assert!(vector::length(&batch_id) > 0, EInvalidBatchId);

        let total = calculate_total(&amounts);
        assert!(coin::value(payment_coin) >= total, EInsufficientBalance);

        event::emit(BatchPaymentExecuted {
            batch_id: batch_id,
            payer: tx_context::sender(ctx),
            total_amount: total,
            recipient_count: len,
            timestamp: tx_context::epoch(ctx),
        });

        let i = 0;
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            let reference = *vector::borrow(&references, i);
            let payment = coin::split(payment_coin, amount, ctx);

            event::emit(PaymentSent {
                batch_id: batch_id,
                recipient,
                amount,
                reference,
            });

            transfer::public_transfer(payment, recipient);
            i = i + 1;
        };
    }

    public entry fun batch_payout(
        payment_coin: &mut Coin<SUI>,
        recipients: vector<address>,
        amounts: vector<u64>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&recipients);
        assert!(len > 0, EEmptyPayments);
        assert!(len == vector::length(&amounts), EMismatchedLengths);

        let total = calculate_total(&amounts);
        assert!(coin::value(payment_coin) >= total, EInsufficientBalance);

        let batch_id = generate_batch_id(ctx);
        event::emit(BatchPaymentExecuted {
            batch_id: batch_id,
            payer: tx_context::sender(ctx),
            total_amount: total,
            recipient_count: len,
            timestamp: tx_context::epoch(ctx),
        });

        let i = 0;
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            let payment = coin::split(payment_coin, amount, ctx);

            event::emit(PaymentSent {
                batch_id: batch_id,
                recipient,
                amount,
                reference: vector::empty(),
            });

            transfer::public_transfer(payment, recipient);
            i = i + 1;
        };
    }

    public entry fun batch_payout_with_refs(
        payment_coin: &mut Coin<SUI>,
        recipients: vector<address>,
        amounts: vector<u64>,
        references: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&recipients);
        assert!(len > 0, EEmptyPayments);
        assert!(len == vector::length(&amounts), EMismatchedLengths);
        assert!(len == vector::length(&references), EMismatchedLengths);

        let total = calculate_total(&amounts);
        assert!(coin::value(payment_coin) >= total, EInsufficientBalance);

        let batch_id = generate_batch_id(ctx);
        event::emit(BatchPaymentExecuted {
            batch_id: batch_id,
            payer: tx_context::sender(ctx),
            total_amount: total,
            recipient_count: len,
            timestamp: tx_context::epoch(ctx),
        });

        let i = 0;
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            let reference = *vector::borrow(&references, i);
            let payment = coin::split(payment_coin, amount, ctx);

            event::emit(PaymentSent {
                batch_id: batch_id,
                recipient,
                amount,
                reference,
            });

            transfer::public_transfer(payment, recipient);
            i = i + 1;
        };
    }

    fun calculate_total(amounts: &vector<u64>): u64 {
        let total = 0u64;
        let len = vector::length(amounts);
        let j = 0;
        while (j < len) {
            total = total + *vector::borrow(amounts, j);
            j = j + 1;
        };
        total
    }

    fun generate_batch_id(ctx: &TxContext): vector<u8> {
        let epoch = tx_context::epoch(ctx);
        let sender = tx_context::sender(ctx);

        let batch_id = vector::empty<u8>();

        let i = 0;
        while (i < 8) {
            vector::push_back(&mut batch_id, ((epoch >> (8 * (7 - i))) & 0xFF as u8));
            i = i + 1;
        };

        let sender_bytes = std::bcs::to_bytes(&sender);
        let j = 0;
        while (j < 8 && j < vector::length(&sender_bytes)) {
            vector::push_back(&mut batch_id, *vector::borrow(&sender_bytes, j));
            j = j + 1;
        };

        batch_id
    }
}
