// Native React page. Data contract: backoffice/tabs/timeline.
import { Fragment, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <div className={"grid g-main"}>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Timeline"}</h2>
            <span className={"small muted"}>
              {"Every automatic action is recorded here. "}
              <span className={"badge b-blue"}>{"customer sees"}</span>
              {" marks what the customer was told."}
            </span>
          </div>
          {"\n    "}
          <div className={"card-b"}>
            <ul className={"tl"}>
              {data.rows1?.length ? (
                data.rows1.map((row1, index) => (
                  <Fragment key={index}>
                    <li>
                      <span className={"when"}>{row1.v2}</span>
                      <span className={"what"}>
                        {row1.v3}
                        {row1.choice4 === 0 ? (
                          <>
                            {" "}
                            <span className={"badge b-blue"}>
                              {"customer sees"}
                            </span>
                          </>
                        ) : null}
                      </span>
                      <span className={"who"}>{row1.v5}</span>
                    </li>
                  </Fragment>
                ))
              ) : (
                <>
                  <li className={"muted"}>{"Nothing yet."}</li>
                </>
              )}
            </ul>
          </div>
        </div>
        {"\n  "}
        <div className={"card"}>
          <div className={"card-h"}>
            <h2>{"Messages to the customer"}</h2>
          </div>
          <div className={"card-b stack"}>
            {"\n    "}
            {data.rows6?.length ? (
              data.rows6.map((row6, index) => (
                <Fragment key={index}>
                  <div className={"small"}>
                    <div className={"muted"}>{row6.v7}</div>
                    <div>{row6.v8}</div>
                    {row6.choice9 === 0 ? (
                      <>
                        <a
                          href={text(row6.v10)}
                          target={"_blank"}
                          rel={"noopener"}
                        >
                          {"Open in WhatsApp ›"}
                        </a>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))
            ) : (
              <>
                <div className={"muted small"}>{"None yet."}</div>
              </>
            )}
          </div>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
